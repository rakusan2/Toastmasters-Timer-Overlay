import { createSocket } from 'dgram'
import { clearInterval, setInterval } from 'timers'
import BufBuilder from './bufBuilder'
import parameters from './preLoad'
import { IUser } from './types'
import { getNumPreset } from '../../common/presets'
import { onUpdate } from './settings'
import { networkInterfaces } from 'os'
import { createServer, Socket } from 'net'

const { tcp, udp } = parameters

let send: null | ((msg: Buffer, port: number, dest?: string) => void) = null

if (udp != null) {
    const { port, broadcast, user = [], interface: if_addr = getInterfaceAddress() } = udp
    const int = networkInterfaces()
    console.log(`Starting UDP Socket on port ${port} of ${if_addr}`)
    if (broadcast) console.log('Socket broadcasting to ' + broadcast)
    const soc = createSocket('udp4')
    let isBroadcast = false
    let clients: { dest: string, port: number, users?: string[] }[] = []
    soc.bind(port, if_addr, () => {
        soc.setMulticastInterface(if_addr)
        send = (msg, port, dest) => {
            const doBroadcast = dest == null
            if (doBroadcast) {
                if (broadcast == null) return
                dest = '255.255.255.255'
            }

            if (doBroadcast !== isBroadcast) {
                isBroadcast = !isBroadcast
                soc.setBroadcast(isBroadcast)
            }
            soc.send(msg, port, dest)
        }

    })
    soc.on('message', (msg, rinfo) => {
        const res = decodeMsg(msg)
        if (res == null) return
        const dest = rinfo.address
        const client = clients.find(a => a.dest === dest)
        if (res.type === 0 && client != null) clients = clients.filter(a => a !== client)
        else if (res.type === 1) {
            if (client == null) clients.push({ dest, port: res.port, users: res.users })
            else {
                client.port = res.port
                client.users = res.users
            }
        }
    })
    soc.on('error', err => console.log('Socket Error', err))
    soc.unref()
    onUpdate(updateUser)
    setInterval(() => {
        if (send == null) return
        if (clients.length > 0) {
            for (let i = 0; i < clients.length; i++) {
                const client = clients[i];
                const buf = buildPacket(client.users)
                if (buf != null) send(buf, client.port, client.dest)
            }
        }
        if (broadcast != null) {
            const buf = buildPacket(user)
            if (buf != null) send(buf, broadcast)
        }
    }, 500).unref()
}

if (tcp != null) {
    const { port = 8891, interface: if_addr = getInterfaceAddress() } = tcp
    console.log(`Starting TCP Socket on port ${port} of ${if_addr}`)
    let clients: { client: Socket, users?: string[] }[] = []
    let timer: NodeJS.Timeout | null = null
    const soc = createServer(client => {
        const dataObj: { client: Socket, users?: string[] } = { client }
        clients.push(dataObj)
        client.on('data', data => {
            const msg = decodeMsg(data, true)
            if (msg == null) return

            if (msg.type === 0) dataObj.users = undefined
            else if (msg.type === 1) {
                dataObj.users = msg.users
                startTimer()
            }
        })
            .on('close', () => {
                clients = clients.filter(a => a !== dataObj)
            })
    })
    soc.on('error', err => console.warn('TCP Error', err))
    soc.listen(port, if_addr)

    function startTimer() {
        if (timer != null) return
        timer = setInterval(() => {
            if (timer == null) return
            const toSend = clients.filter(a => a.users != undefined)
            if (toSend.length === 0) clearInterval(timer)
            for (let i = 0; i < toSend.length; i++) {
                const { client, users } = toSend[i];
                if (users == null) continue
                const msg = buildPacket(users, true)
                if (msg != null) client.write(msg)
            }
        }, 500).unref()
    }
}

const userData: { id: string, green: number, yellow: number, red: number, overtime: number, start: number, stop: number }[] = []
const presets = getNumPreset()

function updateUser(userId: string, settings: IUser['settings']) {
    const { speakerIndex, speakers } = settings
    let preset: string | number | undefined
    if (speakerIndex != null && speakers != null && speakerIndex >= 0 && speakerIndex < speakers.length) {
        preset = speakers[speakerIndex].preset
    } else {
        preset = settings.presetTime
    }

    if (preset == null) preset = 0
    let presetVal = (typeof preset === 'string') ? presets.find(a => a.name === preset) : presets[preset]
    if (presetVal == null) presetVal = {
        name: 'custom',
        fullName: 'Custom',
        green: fixTime(settings.timerGreen, 5),
        yellow: fixTime(settings.timerYellow, 10),
        red: fixTime(settings.timerRed, 15),
        overtime: fixTime(settings.timerOvertime, 20),
    }

    const bUser = userData.find(a => a.id === userId)
    if (bUser == null) {
        userData.push({
            id: userId,
            green: presetVal.green,
            yellow: presetVal.yellow,
            red: presetVal.red,
            overtime: presetVal.overtime,
            start: settings.timerStart ?? 0,
            stop: settings.timerStop ?? 0,
        })
    } else {
        bUser.green = presetVal.green
        bUser.yellow = presetVal.yellow
        bUser.red = presetVal.red
        bUser.yellow = presetVal.overtime
        bUser.start = settings.timerStart ?? 0
        bUser.stop = settings.timerStop ?? 0
    }
}

function decodeMsg(buf: Buffer, isTCP?: false): null | (IMessage & { port: number })
function decodeMsg(buf: Buffer, isTCP: true): null | IMessage
function decodeMsg(buf: Buffer, isTCP = false): null | IMessage {
    let index = 0
    let port: undefined | number
    if (!isTCP) {
        if (buf.length < 7) return null
        const magic = buf.readUInt32BE()
        if (magic !== 0xA1_AE_04_92) return null
        port = buf.readUInt16BE(4)
        index += 6
    } else if (buf.length < 1) return null
    const msgType = buf[index++]
    if (msgType === 0) return { type: 0, port }
    if (msgType === 1) return decodeMsgUser(buf, index, port)
    return null
}

function decodeMsgUser(buf: Buffer, index: number, port?: number): IMessageUser | null {
    const userCount = buf[index]
    index++
    const users: string[] = []
    for (let i = 0; i < userCount; i++) {
        if (index >= buf.length) return null
        const strLen = buf[index]
        index++
        if (index + strLen >= buf.length) return null
        const str = buf.toString('utf8', index, index + strLen)
        index += strLen
        users.push(str)
    }
    return { type: 1, port, users }
}

function buildPacket(filter?: string[], skipMagic = false) {
    if (filter == null) return null
    const filteredUsers = (filter.length === 0) ? userData : userData.filter(a => filter.includes(a.id))
    if (filteredUsers.length === 0) return null
    const buf = new BufBuilder()
    const len = filteredUsers.length & 0xff

    if (!skipMagic) buf.addUInt(0xA1_E8_A8_72) // Random number to identify the message
    buf.addByte(len)

    for (let i = 0; i < len; i++) {
        const user = filteredUsers[i];
        buf.addString(user.id)
            .addUInt(user.start > user.stop ? Date.now() - user.start : user.stop - user.start)
            .addUInt(user.green, 2)
            .addUInt(user.yellow, 2)
            .addUInt(user.red, 2)
            .addUInt(user.overtime, 2)
    }
    return buf.build()
}

export function fixTime(time: IBadTimeInput, defaultVal = 0) {
    if (time == null) return defaultVal
    if (typeof time === 'number') {
        if (Number.isSafeInteger(time)) return Math.abs(time) & 0xffff
        return defaultVal
    }
    const str = /^(?:(\d+):)?(\d+)$/.exec(time)
    if (str == null) return defaultVal
    return ((+(str[1]) * 60) + +(str[2])) & 0xffff
}

function getInterfaceAddress() {
    const inter = networkInterfaces()
    const entries = Object.entries(inter)
    for (let i = 0; i < entries.length; i++) {
        const [key, adapter] = entries[i];
        if (adapter == null) continue
        if (key.toLowerCase().includes('virtual')) continue
        const temp = adapter.find(a => a.family === 'IPv4' && !a.internal)
        if (temp != null) return temp.address
    }
    return '0.0.0.0'
}

type IBadTimeInput = string | number | undefined


interface IMessageBase<T extends Number> {
    type: T
    port?: number
}

type IMessage = IMessageStop | IMessageUser

type IMessageStop = IMessageBase<0>

interface IMessageUser extends IMessageBase<1> {
    users: string[]
}

