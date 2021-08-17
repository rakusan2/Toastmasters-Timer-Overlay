import * as http from 'http'
import { platform } from 'os'
import * as args from 'command-line-args'
import handler = require('serve-handler')
import { Server, Socket } from 'socket.io'
import { IServeHandler } from './serverTypes'
import { IUser, IKeyVal, IResponseFn, IResponseInit, ISetting, ISettings, IOptions } from './types'

const { server: serverOptions, obs: obsOptions } = args([
    { name: 'port', alias: 'p', type: Number, defaultOption: true, group: 'server', defaultValue: 8888 },
    { name: 'cache', alias: 'c', type: boolOrString('3600'), defaultOption: true, group: 'server' },
    { name: 'one-id', alias: 'i', type: defaultOnSetOrTrue('aaaa'), defaultOption: true, group: 'server' },
    { name: 'open', alias: 'o', type: Boolean, group: 'server' },
    { name: 'obs', alias: 's', type: defaultOnSetOrTrue(true), group: 'obs' },
    { name: 'profile', group: 'obs' },
    { name: 'scene', group: 'obs' },
    { name: 'minimize', type: Boolean, group: 'obs' }
], { caseInsensitive: true }) as IOptions

function trueOrString(val: string | null) {
    if (val == null) return true
    return val
}

function boolOrString(defaultVal: string | boolean) {
    return (val: string | null) => {
        if (val == null) return defaultVal
        const tempVal = val.toLowerCase()
        if (tempVal === 'false') return false
        if (tempVal === 'true') return true
        return val
    }
}
function defaultOnSetOrTrue<T>(defaultVal: T) {
    return (val: string | null) => {
        if (val == null) return defaultVal
        const tempVal = val.toLowerCase()
        if (tempVal === 'true') return defaultVal
        if (tempVal === 'false') return void 0
        return val
    }
}

const { port, cache } = serverOptions
let oneID = serverOptions['one-id']

if (typeof cache === 'string' && Number.isNaN(+cache)) {
    console.warn(`Invalid Cache Time. Got ${cache}`)
}

if (oneID != null) {
    try {
        oneID = encodeURIComponent(oneID)
        if (oneID.length > 6) {
            oneID = 'aaaa'
            console.warn('The ID is too long. Setting id to "aaaa"')
        }
        if (oneID.includes('%')) {
            oneID = 'aaaa'
            console.warn('Invalid id. Setting id to "aaaa"')
        }
    } catch (err) {
        oneID = 'aaaa'
        console.error('That Id could hurt someone')
    }
}

const dir = __dirname.split(/\\|\//)
dir.pop()
const webDir = dir.join('/') + "/web"

const handlerConfig: IServeHandler = {
    public: webDir,
    cleanUrls: true,
    etag: true,
    unlisted: [
        "src",
        "tsconfig.json"
    ]
}

if (cache) {
    handlerConfig.headers = [
        {
            source: '*',
            headers: [
                { key: 'Cache-Control', value: `max-age=${cache}` }
            ]
        }
    ]
}

const web = http.createServer((req, res) => {
    return handler(req, res, handlerConfig)
})

const io = new Server(web)
const users: { [id: string]: IUser } = {}
const sockets: IKeyVal<Socket[]> = {}

web.listen(port, () => {
    const address = `http://localhost:${port}`
    console.log(`listening at ${address} with cache set to ${cache}`)

    if (serverOptions.open != null) {
        const openVal = serverOptions.open
        open(address, openVal == '' ? undefined : { app: { name: openVal } }).catch(() => console.log('Can not Open'))
    }
    if (obsOptions.obs != null) {
        openOBS({
            path: (typeof obsOptions.obs === 'string') ? obsOptions.obs : void 0,
            profile: obsOptions.profile,
            scene: obsOptions.scene,
            min: obsOptions.minimize
        }).catch(err => console.error('Unable to launch OBS\nPlease pass in the path to the OBS executable or install OBS\nhttps://obsproject.com/download'))
    }
})

web.on('close', () => console.log('closing'))

io.on('connection', socket => {
    let userID: string
    let user: IUser

    function logUserCount(id = userID) {
        const count = sockets[id].length
        console.log(`ID ${id} has ${count} user${count === 1 ? '' : 's'}`)
    }

    function disconnect() {
        if (typeof userID == 'string' && typeof sockets[userID] !== 'undefined') {
            sockets[userID] = sockets[userID].filter(soc => soc != socket)
            console.log({ disconnect: { id: userID } })
            logUserCount()
        }
    }

    socket.on('disconnect', () => disconnect())
    socket.on('init', (id, fn: IResponseFn<IResponseInit>, ...args) => {
        console.log({ id, init: args })
        try {
            disconnect()

            userID = initUser(id)
            user = users[userID]
            console.log({ userID, user })

            if (typeof sockets[userID] === 'undefined') {
                sockets[userID] = [socket]
            } else {
                sockets[userID].push(socket)
            }

            logUserCount()

            user.lastMessageAt = Date.now()
            fn({ ok: true, id: userID, settings: user.settings, serverTime: Date.now(), idLock: oneID != null })
        } catch (err) {
            console.log({ init: { err } })
            if (typeof 'string') {
                fn({ ok: false, err })
            } else if (err instanceof Error) {
                fn({ ok: false, err: err.message })
                console.error(err)
            } else console.log({ err })
        }
    }).on('set', (settings: IKeyVal<ISetting>, fn: IResponseFn<{ keysNotSet: string[] }>) => {
        console.log({ id: userID, set: settings })
        user.lastMessageAt = Date.now()
        if (typeof user === 'undefined') {
            fn({ ok: false, err: 'ID not Set' })
            return
        }
        let keysNotSet = []
        let changedSettings: IKeyVal<ISetting> = {}
        for (let key in settings) {
            const val = settings[key]
            if (val != null) {
                user.settings[key] = val
                changedSettings[key] = val
            } else {
                keysNotSet.push(key)
            }
        }
        fn({ ok: true, keysNotSet })
        console.log({ keysNotSet })
        if (Object.keys(changedSettings).length > 0) {
            sockets[userID].forEach(soc => {
                if (socket !== soc) {
                    soc.emit('changedSetting', { ok: true, settings: changedSettings })
                }
            })
        }
    }).on('get', (keys: string | string[] | undefined, fn: IResponseFn<ISettings>) => {
        console.log({ id: userID, get: keys })
        user.lastMessageAt = Date.now()
        if (typeof user === 'undefined') {
            fn({ ok: false, err: 'ID not Set' })
            return
        }
        if (keys == null) {
            fn({ ok: true, settings: user.settings })
        } else if (Array.isArray(keys) && keys.every(a => typeof a === 'string')) {
            const settings: IKeyVal<ISetting> = {}
            keys.filter(key => typeof user.settings !== 'undefined')
                .forEach(key => settings[key] = user.settings[key])
            fn({ ok: true, settings })
        } else if (typeof keys === 'string') {
            if (typeof user.settings[keys] !== 'undefined') {
                fn({ ok: true, settings: { [keys]: user.settings[keys] } })
            } else {
                fn({ ok: true, settings: {} })
            }
        } else {
            fn({ ok: false, err: 'Invalid Keys' })
        }
    })
})

function initUser(id?: string | null) {
    if (typeof oneID == 'string') {
        id = oneID
    } else if (id == null || id === '') {
        id = getID()
    }
    if ((typeof id === 'string') && /^[a-zA-Z0-9_\-]{1,6}$/.test(id)) {
        if (typeof users[id] === 'undefined') {
            users[id] = { lastMessageAt: Date.now(), settings: {} }
        }
        return id
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
const URL_BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
function getRandomStr64(len: number) {
    let res = ''
    for (let i = 0; i < len; i++) {
        const index = Math.round(Math.random() * (URL_BASE64.length - 1))
        res += URL_BASE64[index]
    }
    return res
}

/**
 * Turns process.argv to an object
 * @param names Names to be given to arguments with out any
 * @param flags These arguments get turned to keys with empty string if seen
 */
function getParams(names: string[] = [], flags: string[] = []) {
    const nameless: string[] = []
    const res: IKeyVal<string> = {}
    process.argv.splice(2).map(a => {
        const named = a.match(/^([^=]*)=(.*)$/)
        if (named == null) {
            nameless.push(a)
        } else {
            const [, key, val] = named
            res[key.toLowerCase()] = val
        }
    })
    let namesIndex = 0
    nameless.forEach((val, i) => {
        const valLow = val.toLowerCase()
        if (flags.includes(valLow) && typeof res[valLow] == 'undefined') {
            res[valLow] = ''
            return
        }
        while (namesIndex < names.length && typeof res[names[namesIndex]] != 'undefined') {
            namesIndex++
        }
        if (namesIndex < names.length) {
            res[names[namesIndex]] = val
        }
    })
    return res
}

async function open(address: string, opt?: import('open').Options) {
    const open = await import('open')
    if (opt != null) {
        await open(address, opt)
    } else {
        await open(address)
    }
    console.log(`Opened '${address}'`)
}

const obsPath: { [key: string]: string } = {
    win32: 'C:/Program Files/obs-studio/bin/64bit/obs64.exe',
    linux: 'obs', //TODO Change to correct location
    darwin: '/Applications/OBS.app/Contents/MacOS/OBS'
}

async function openOBS({ path, profile, scene, min }: { path?: string, profile?: string, scene?: string, min?: boolean } = {}) {
    if (path == null || path == '') {
        const os = platform()
        path = obsPath[os]
        if (path == null) throw new Error(`The platform ${os} does not have a default path`)
    }

    let command = path + ' --startvirtualcam'

    if (profile != null && profile.length > 0) {
        if (profile.includes('"')) throw new Error('profile has "')
        command += ` --profile "${profile}"`
    }
    if (scene != null && scene.length > 0) {
        if (scene.includes('"')) throw new Error('scene has "')
        command += ` --scene "${scene}"`
    }
    if (min === true) {
        command += ` --minimize-to-tray`
    }

    return await cmd(command)
}

function cmd(command: string) {
    return new Promise<string>((res, rej) => {
        import('child_process').then(cp => {
            cp.exec(command, { windowsHide: true }, (err, data) => {
                if (err != null) {
                    rej(err)
                } else res(data)
            })
        }).catch(rej)
    })
}