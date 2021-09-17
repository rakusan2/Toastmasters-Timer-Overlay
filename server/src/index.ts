import parameters from './preLoad'
import createServer from './webServer'
import { Socket } from 'socket.io'
import { openOBS, open, getRandomStr64, isStringArray } from './tools'
import { IUser, IKeyVal, IResponseFn, IResponseInit, ISetting, ISettings } from './types'
import { Settings } from './settings'
import './broadcast'

const { oneID, obs, open: openLoc } = parameters

const users: { [id: string]: IUser } = {}
const sockets: IKeyVal<Socket[]> = {}

const io = createServer(address => {
    if (oneID != null) console.log(`OneID is set to ${oneID}`)

    if (openLoc != null) {
        const openVal = openLoc
        open(address, openVal === '' ? undefined : { app: { name: openVal } }).catch(() => console.log('Can not Open'))
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
            fn({ ok: true, id: userID, settings: user.data, serverTime: Date.now(), idLock: oneID != null })
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
        console.log({ id: user.id, set: settings })
        lastTimestamp = Date.now()
        let { keysNotSet, keysSet } = user.set(settings)
        fn({ ok: true, keysNotSet })
        console.log({ keysNotSet })
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
        console.log({ id: user.id, get: keys })
        lastTimestamp = Date.now()
        if (keys == null || typeof keys === 'string') {
            fn({ ok: true, settings: user.getObj(keys) })
        } else if(isStringArray(keys)){
            if(keys.length > 100) fn({ok: false, err: 'GET is limited to 100 keys'})
        }else {
            fn({ ok: false, err: 'Invalid Keys' })
        }
    })
})

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
