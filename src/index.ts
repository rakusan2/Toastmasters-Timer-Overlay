import * as http from 'http'
import * as express from 'express'
import * as socket from 'socket.io'

const PORT = 8888

const app = express()
const web = http.createServer(app)
const io = socket(web)

const users: { [id: number]: IUser } = {}

const sockets: IKeyNVal<socket.Socket[]> = {}

const path = __dirname.split('\\').slice(0, -1).join('\\') + '\\web'

app.get('/', (req, res) => res.sendFile(path + '\\index.html'))
app.get('/style.css', (req, res) => res.sendFile(path + '\\style.css'))
app.get('/web.js', (req, res) => res.sendFile(path + '\\web.js'))

web.listen(PORT, () => {
    console.log(`listening at http://localhost:${PORT} with web at ${path}`)
})

io.on('connection', socket => {
    let userID: number
    let user: IUser
    socket.on('disconnect', () => {
        if (typeof userID == 'number' && typeof sockets[userID] !== 'undefined') {
            sockets[userID] = sockets[userID].filter(soc => soc != socket)
            console.log({ disconnect: { id: userID } })
            console.log(`ID ${userID} has ${sockets[userID].length} users`)
        }
    })
    socket.on('init', (id, fn: IResponseFn<IResponseInit>, ...args) => {
        console.log({ init: { id, args } })
        try {
            userID = initUser(id)
            user = users[userID]
            console.log({ user, userID })

            if (typeof sockets[userID] === 'undefined') {
                sockets[userID] = [socket]
            } else {
                sockets[userID].push(socket)
            }

            console.log(`ID ${userID} has ${sockets[userID].length} users`)

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
        console.log({changedSettings})
        if (Object.keys(changedSettings).length > 0) {
            sockets[userID].forEach(soc => soc.emit('changedSetting', { ok: true, settings: changedSettings }))
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
