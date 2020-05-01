import * as http from 'http'
import * as socket from 'socket.io'
import * as nodeStatic from 'node-static'
import * as open from 'open'

const params = getParams(['port', 'cache', 'one-id', 'open'], ['help', 'one-id', 'open'])
let port = 8888
let cache: number | boolean = 3600
let oneID: string | null = null

if ('port' in params) {
    let tempPort = +params.port
    if (!Number.isNaN(tempPort)) {
        port = tempPort
    } else {
        console.warn(`Invalid Port Number. Got ${params.port}`)
    }
}
if ('cache' in params) {
    let tempCache = params.cache
    if (tempCache.toLowerCase() === 'false') {
        cache = false
    } else if (!Number.isNaN(+tempCache)) {
        cache = +tempCache
    } else {
        console.warn(`Invalid Cache Time. Got ${params.cache}`)
    }
}

if ('one-id' in params) {
    const val = params['one-id'].toLowerCase()
    if (val == '') {
        oneID = 'aaaa'
    } else if (val == 'false' || val == 'true') {
        oneID = (val == 'true' ? 'aaaa' : null)
    } else {
        try {
            oneID = encodeURIComponent(params['one-id'])
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
}

if (typeof params.help != 'undefined') {
    console.log(`Run with [port] [cache] [one-id]
    [port] sets the Port number to listen on. Default 8888. Parameter is required.
    [cache] sets how many seconds the browser should cache the site for. Default 3600. Parameter is required.
    [one-id] sets whether or not the server sets all ids to "aaaa". Default false
    [open] Opens browser window`)
    process.exit()
}

const fileServer = new nodeStatic.Server('./web', { cache })

const web = http.createServer((req, res) => {
    req.addListener('end', () => {
        fileServer.serve(req, res)
    }).resume()
})
const io = socket(web)

const users: { [id: string]: IUser } = {}

const sockets: IKeyVal<socket.Socket[]> = {}

web.listen(port, () => {
    const address = `http://localhost:${port}`
    console.log(`listening at ${address} with cache set to ${cache}`)

    if ('open' in params) {
        const openVal = params.open
        if (openVal != '') {
            open(address, { app: openVal })
        } else {
            open(address)
        }
    }
})

io.on('connection', socket => {
    let userID: string
    let user: IUser

    function logUserCount(id = userID) {
        console.log(`ID ${id} has ${sockets[id].length} users`)
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
        console.log({ init: { id, args } })
        try {
            disconnect()

            userID = initUser(id)
            user = users[userID]
            console.log({ user, userID })

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
        console.log({ set: { id: userID, settings } })
        user.lastMessageAt = Date.now()
        if (typeof user === 'undefined') {
            fn({ ok: false, err: 'ID not Set' })
            return
        }
        let keysNotSet = []
        let changedSettings: IKeyVal<ISetting> = {}
        for (let key in settings) {
            const val = settings[key]
            if ((typeof val === 'string') || (typeof val === 'number') || (typeof val === 'boolean')) {
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
        console.log({ get: { id: userID, keys } })
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
    } else if (id == null) {
        id = getID()
    }
    if ((typeof id === 'string') && /^[a-zA-Z0-9_-]{1,6}$/.test(id)) {
        if (typeof users[id] === 'undefined') {
            users[id] = { lastMessageAt: Date.now(), settings: {} }
        }
        return id
    } else throw 'Invalid ID'
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
        const index = Math.round(Math.random() * URL_BASE64.length)
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

type IResponseFn<T = {}> = (res: IResponse<T>) => any

type IResponse<T = {}> = IResponseERR | (IResponseOK & T)

interface IUser extends ISettings {
    lastMessageAt: number
}
interface IResponseERR {
    ok: false
    err: string
}
interface IResponseOK {
    ok: true
}
interface IResponseInit extends ISettings {
    id: string
    idLock: boolean
    serverTime: number
}
interface ISettings {
    settings: IKeyVal<ISetting>
}
type IKeyVal<T> = { [key: string]: T }
type IKeyNVal<T> = { [key: number]: T }
type ISetting = string | number | boolean
