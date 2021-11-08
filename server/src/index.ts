import parameters from './preLoad'
import createServer from './webServer'
import { Socket } from 'socket.io'
import { openOBS, open, getRandomStr64, isStringArray } from './tools'
import { IUser, IKeyVal, IResponseFn, IResponseInit, ISetting, ISettings, GithubReleaseResponse, VersionCheckStatus, GithubAsset } from './types'
import { Settings } from './settings'
import './broadcast'
import { get } from 'https'
import { platform } from 'os'
import { writeFile } from 'fs/promises'
import { readFileSync } from 'fs'

const { oneID, obs, open: openLoc } = parameters

console.log('parameters', parameters)

let lastVersion = 'v0.0.0'

try {
    const dir = __dirname.split(/\\|\//).slice(0, -2).join('/')
    console.log(dir)
    const pkgFile = readFileSync(dir + '/package.json', 'utf8')
    const pkg = JSON.parse(pkgFile) as { version: string, name: string }
    lastVersion = 'v' + pkg.version
} catch { }

console.log('Version:', lastVersion)

const users: { [id: string]: IUser } = {}
const sockets: IKeyVal<Socket[]> = {}

const io = createServer(address => {
    if (oneID != null) console.log(`OneID is set to ${oneID}`)

    if (openLoc != null) {
        const openVal = openLoc
        open(address, typeof openVal !== 'string' ? undefined : { app: { name: openVal } }).catch(() => console.log('Can not Open'))
    }
    if (obs != null) {
        openOBS(obs).catch(err => console.error(err, 'Unable to launch OBS\nPlease pass in the path to the OBS executable or install OBS\nhttps://obsproject.com/download\n'))
    }
})

io.on('connection', socket => {
    let user: Settings | null = null
    let lastTimestamp = 0

    function logUserCount(id?: string) {
        if (id == null) {
            if (user == null) return
            id = user.id
        }

        const count = sockets[id].length
        console.log(`ID ${id} has ${count} user${count === 1 ? '' : 's'}`)
    }

    function disconnect() {
        if (user == null) return null
        const id = user.id
        if (typeof sockets[id] === 'undefined') return

        sockets[id] = sockets[id].filter(soc => soc != socket)
        console.log({ disconnect: { id } })
        logUserCount()
    }

    socket.on('disconnect', disconnect)
    socket.on('init', (id, fn: IResponseFn<IResponseInit>, ...args) => {
        console.log({ id, init: args })
        try {
            disconnect()

            user = initUser(id)
            const userID = user.id
            console.log('Connected', { userID: user.id, user: user.data })

            if (typeof sockets[userID] === 'undefined') {
                sockets[userID] = [socket]
            } else {
                sockets[userID].push(socket)
            }

            logUserCount()

            lastTimestamp = Date.now()
            fn({ ok: true, id: userID, settings: user.data, serverTime: Date.now(), idLock: oneID != null, version: lastVersion })
        } catch (err: any) {
            console.log({ init: { err } })
            if (typeof err == 'string') {
                fn({ ok: false, err })
            } else if (err instanceof Error) {
                fn({ ok: false, err: err.message })
                console.error(err)
            } else console.log({ err })
        }
    }).on('set', (settings: IKeyVal<ISetting>, fn: IResponseFn<{ keysNotSet: string[] }>) => {
        if (user == null) {
            fn({ ok: false, err: 'ID not Set' })
            return
        }
        console.log(`ID ${user.id} Set:`, settings)
        lastTimestamp = Date.now()
        let { keysNotSet, keysSet } = user.set(settings)
        fn({ ok: true, keysNotSet })
        if (keysNotSet.length > 0) console.warn({ keysNotSet })
        if (Object.keys(keysSet).length > 0) {
            sockets[user.id].forEach(soc => {
                if (socket !== soc) {
                    soc.emit('changedSetting', { ok: true, settings: keysSet })
                }
            })
        }
    }).on('get', (keys: string | string[] | undefined, fn: IResponseFn<ISettings>) => {
        if (user == null) {
            fn({ ok: false, err: 'ID not Set' })
            return
        }
        console.log(`ID ${user.id} Get:`, keys)
        lastTimestamp = Date.now()
        if (keys == null || typeof keys === 'string') {
            fn({ ok: true, settings: user.getObj(keys) })
        } else if (isStringArray(keys)) {
            if (keys.length > 100) fn({ ok: false, err: 'GET is limited to 100 keys' })
        } else {
            fn({ ok: false, err: 'Invalid Keys' })
        }
    })
        .on('checkVersion', (_msg: any, fn: IResponseFn<VersionCheckStatus>) => {
            if (!isCheckingVersion) checkVersion()
            switch (versionStatus) {
                case VersionStatus.checking:
                    fn({ ok: true, version: lastVersion, status: 'Checking' })
                    break
                case VersionStatus.downloading:
                    fn({ ok: true, version: lastVersion, status: 'Downloading' })
                    break
                case VersionStatus.err:
                    fn({ ok: false, err: 'Version Check Error' })
                    break
                case VersionStatus.newest:
                    fn({ ok: true, version: lastVersion, status: 'Newest' })
                    break
                case VersionStatus.noPlatform:
                    fn({ ok: false, err: 'Unknown Platform' })
                    break
                case VersionStatus.noRelease:
                    fn({ ok: true, version: lastVersion, status: 'Release Not Found' })
                    break
            }
        })
})

let lastCheck = 0
let isCheckingVersion = false
let versionStatus = VersionStatus.newest

const enum VersionStatus {
    checking,
    downloading,
    newest,
    noPlatform,
    noRelease,
    err
}

async function checkVersion() {
    const timestamp = Date.now()
    if (timestamp - lastCheck < 1000) {
        return
    }
    isCheckingVersion = true
    lastCheck = Date.now()
    try {
        versionStatus = VersionStatus.checking
        const data = await getP<GithubReleaseResponse[]>('https://api.github.com/repos/rakusan2/Toastmasters-Timer-Overlay/releases?per_page=4')
        if (typeof data === 'string') {
            isCheckingVersion = false
            console.warn('Unable to parse GitHub Data')
            isCheckingVersion = false
            versionStatus = VersionStatus.err
            return
        }
        const obj = data.find(a => !a.prerelease && !a.draft)
        if (obj == null) {
            console.warn('Unable to find release version')
            isCheckingVersion = false
            versionStatus = VersionStatus.noRelease
            return
        }
        if (obj.tag_name === lastVersion) {
            isCheckingVersion = false
            versionStatus = VersionStatus.newest
            return
        }

        let assetID = 0
        let asset: GithubAsset | undefined
        const os = platform()
        let platformStr: string = ''
        if (os === 'win32') platformStr = 'timer-overlay-win.exe'
        else if (os === 'linux') platformStr = 'timer-overlay-linux'
        else if (os === 'darwin') platformStr = 'timer-overlay-macos'

        asset = obj.assets.find(a => a.name === platformStr)

        if (asset == null) {
            isCheckingVersion = false
            versionStatus = VersionStatus.noPlatform
            return
        }
        versionStatus = VersionStatus.downloading
        const assetBin = await getP<Buffer>('https://api.github.com/repos/rakusan2/Toastmasters-Timer-Overlay/releases/assets/' + assetID, true)
        await writeFile(platformStr, assetBin)

    } catch (err) {
        console.warn(err)
        versionStatus = VersionStatus.err
        isCheckingVersion = false
        return
    }
    isCheckingVersion = false
    versionStatus = VersionStatus.newest
}

function initUser(id?: string | null) {
    if (typeof oneID === 'string') {
        id = oneID
    } else if (id == null || id === '') {
        id = getID()
    }
    if ((typeof id === 'string') && /^[a-zA-Z0-9_\-]{1,6}$/.test(id)) {
        return new Settings(id)
    } else throw `'${id}' is an invalid ID`
}

function getID() {
    let id = '', round = 0
    do {
        id = getRandomStr64(4)
        round++;
        if (round > 20) {
            throw 'Unable to Get ID'
        }
    } while (typeof users[id] !== 'undefined')
    users[id] = { settings: {}, lastMessageAt: Date.now() }
    return id
}

function getP<T>(uri: string, bin: true): Promise<Buffer>
function getP<T>(uri: string, bin?: false): Promise<T | string>
function getP(uri: string, bin = false) {
    return new Promise<any>((res, rej) => {
        const req = get(uri, socket => {
            const result: Buffer[] = []
            let len = 0
            socket.on('data', (data: Buffer) => {
                result.push(data)
                len += data.length
            }).on('close', () => {
                const status = socket.statusCode ?? 0
                const binary = Buffer.concat(result, len)
                const str = binary.toString('utf8')
                if (status >= 200 || status < 300) {
                    if (bin) {
                        res(binary)
                        return
                    }
                    try {
                        const parsed = JSON.parse(str)
                        res(parsed)
                    } catch {
                        res(str)
                    }
                } else rej(str)
            })
        })
        req.on('error', rej)
    })
}
