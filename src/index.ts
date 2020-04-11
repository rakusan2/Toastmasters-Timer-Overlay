import * as http from 'http'
import * as socket from 'socket.io'
import * as nodeStatic from 'node-static'

const params = getParams(['port', 'cache'], ['help'])
let port = 8888
let cache: number | boolean = 3600

if (typeof params.port == 'string') {
    let tempPort = +params.port
    if (!Number.isNaN(tempPort)) {
        port = tempPort
    } else {
        console.warn(`Invalid Port Number. Got ${params.port}`)
    }
}
if (typeof params.cache == 'string') {
    let tempCache = params.cache
    if (tempCache.toLowerCase() === 'false') {
        cache = false
    } else if (!Number.isNaN(+tempCache)) {
        cache = +tempCache
    } else {
        console.warn(`Invalid Cache Time. Got ${params.cache}`)
    }
}

if (typeof params.help != 'undefined') {
    console.log(`Run with [port] [cache]
    [port] sets the Port number to listen on
    [cache] sets how many seconds the browser should cache the site for`)
    process.exit()
}

const fileServer = new nodeStatic.Server('./web', { cache })

const web = http.createServer((req, res) => {
    req.addListener('end', () => {
        fileServer.serve(req, res)
    }).resume()
})
const io = socket(web)

const users: { [id: number]: IUser } = {}

const sockets: IKeyNVal<socket.Socket[]> = {}

web.listen(port, () => {
    console.log(`listening at http://localhost:${port} with cache set to ${cache}`)
})

io.on('connection', socket => {
    let userID: number
    let user: IUser

    function disconnect() {
        if (typeof userID == 'number' && typeof sockets[userID] !== 'undefined') {
            sockets[userID] = sockets[userID].filter(soc => soc != socket)
            console.log({ disconnect: { id: userID } })
            console.log(`ID ${userID.toString(16)} has ${sockets[userID].length} users`)
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

            console.log(`ID ${userID.toString(16)} has ${sockets[userID].length} users`)

            user.lastMessageAt = Date.now()
            fn({ ok: true, id: userID, settings: user.settings })
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

function initUser(id: any) {
    if (typeof id === 'string') {
        id = parseInt(id, 16)
    } else if (id == null) {
        id = getID()
    }
    if (id > 0 && id < 0xffff && typeof users[id] === 'undefined') {
        users[id] = { lastMessageAt: Date.now(), settings: {} }
    }
    if (typeof id === 'number' && !Number.isNaN(id) && typeof users[id] !== 'undefined') {
        return id
    } else throw 'Invalid ID'
}

function getID() {
    let id = 0, round = 0
    do {
        id = Math.floor(Math.random() * 0xffff)
        round++;
        if (round > 20) {
            throw 'Unable to Get ID'
        }
    } while (typeof users[id] !== 'undefined')
    users[id] = { settings: {}, lastMessageAt: Date.now() }
    return id
}

function getParams(names: string[] = [], flags: string[] = []) {
    const nameless: string[] = []
    const res: IKeyVal<string> = { }
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
    id: number
}
interface ISettings {
    settings: IKeyVal<ISetting>
}
type IKeyVal<T> = { [key: string]: T }
type IKeyNVal<T> = { [key: number]: T }
type ISetting = string | number | boolean
