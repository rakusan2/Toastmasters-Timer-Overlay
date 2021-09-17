import { getParams } from './params';
import { readFileSync, lstatSync } from 'fs';
import { networkInterfaces } from 'os'

// const params = getParams(['port', 'cache', 'one-id', 'open', 'obs', 'obs-cwd', 'obs-profile', 'obs-scene', 'cert', 'key', 'socket', 'socket-broadcast', 'socket-user'], ['one-id', 'open', 'obs', 'obs-minimize', 'socket', 'socket-broadcast'])
const params = getParams([
    {
        name: 'port',
        shortName: 'p',
        type: 'number',
        validateRaw: /^\d{2,6}$/
    },
    {
        name: 'cache',
        type: ['number', 'boolean'],
        replace: (val: boolean | number) => (typeof val !== 'boolean') ? val : val ? 3600 : null,
        validate: (val: number | null) => {
            if (val == null) return true
            if (val <= 10) return 'Cache Age is too short'
        }
    },
    {
        name: 'one-id',
        shortName: 'i',
        type: 'string',
        switchValue: 'aaaa',
        parameterName: 'oneID',
        replace: encodeURIComponent,
        validate: validateID
    },
    {
        name: 'open',
        shortName: 'o',
        type: 'string',
        switchValue: true
    },
    {
        name: 'obs',
        shortName: 'b',
        type: 'string',
        group: 'obs',
        parameterName: 'path',
        switchValue: true
    },
    {
        name: 'obs-cwd',
        type: 'string',
        group: 'obs',
        parameterName: 'cwd'
    },
    {
        name: 'obs-profile',
        type: 'string',
        group: 'obs',
        parameterName: 'profile'
    },
    {
        name: 'obs-scene',
        type: 'string',
        group: 'obs',
        parameterName: 'scene'
    },
    {
        name: 'obs-minimize',
        switchValue: true,
        group: 'obs',
        parameterName: 'min'
    },
    {
        name: 'cert',
        type: 'string',
        group: 'sslConfig',
        validateRaw: val => val.length > 2
    },
    {
        name: 'key',
        type: 'string',
        group: 'sslConfig',
        validateRaw: val => val.length > 2
    },
    {
        name: 'udp',
        shortName: 'u',
        type: 'number',
        validateRaw: /^\d{2,6}$/,
        switchValue: 8889,
        group: 'udp',
        parameterName: 'port'
    },
    {
        name: 'broadcast',
        type: 'number',
        validateRaw: /^\d{2,6}$/,
        switchValue: 8890,
        group: 'udp',
        parameterName: 'broadcast'
    },
    {
        name: 'broadcast-user',
        alias: 'b-user',
        type: 'string',
        group: 'udp',
        parameterName: 'user',
        replace: encodeURIComponent,
        validate: validateID,
        multiple: true
    },
    {
        name: 'udp-interface',
        alias: 'udp-if',
        type: 'string',
        group: 'udp',
        parameterName: 'interface',
        replace: replaceInterface,
        validate: validateInterface,
    },
    {
        name: 'tcp',
        shortName: 't',
        type: 'number',
        validateRaw: /^\d{2,6}$/,
        switchValue: 8891,
        group: 'tcp',
        parameterName: 'port'
    },
    {
        name: 'tcp-interface',
        type: 'string',
        group: 'tcp',
        parameterName: 'interface',
        replace: replaceInterface,
        validate: validateInterface
    }
]) as {
    port?: number
    cache?: number | null
    oneID?: string
    open?: string
    obs?: {
        path?: string | true
        cwd?: string
        scene?: string
        profile?: string
        min?: true
    }
    sslConfig?: {
        cert?: string
        key?: string
    }
    udp?: {
        port?: number
        broadcast?: number
        user?: string[],
        interface?: string
    }
    tcp?: {
        port?: number,
        interface?: string
    }
}

function replaceInterface(val: string) {
    const inter = networkInterfaces()
    if (/^((\d{1,2}|2[0-4]\d|25[0-5])\.){3}(\d{1,2}|2[0-4]\d|25[0-5])$/.test(val)) {
        const entries = Object.entries(inter)
        for (let i = 0; i < entries.length; i++) {
            const [key, adapter] = entries[i];
            if (adapter != null && adapter.some(a => a.address === val)) return val
        }
    } else {
        const temp = inter[val]
        if (temp != null) {
            const interfaces = temp.find(a => a.family === 'IPv4')
            if (interfaces == null) return { err: `Interface ${val} does not have an IPv4 interface` }
            return interfaces.address
        }
    }
    return { err: 'Valid interfaces are ' + Object.keys(inter).join(', ') }
}

function validateInterface(val: string | { err: string }) {
    if (typeof val === 'string') return true
    return val.err
}

function validateID(val: string) {
    if (val.length === 0) return 'ID is too short'
    if (val.length > 6) return 'ID is too long'
    if (val.includes('%')) return 'ID has invalid characters'
}

let ssl: { cert: Buffer, key: Buffer } | undefined
if (params.sslConfig != null) {
    const { cert, key } = params.sslConfig
    const certDir = cert ?? key

    if (cert != null && key != null) {
        const certFS = tryReadFile(cert),
            keyFS = tryReadFile(key)
        if (certFS != null && keyFS != null) {
            ssl = { cert: certFS, key: keyFS }
        }
    } else if (certDir != null) {
        ssl = getCertKey(certDir)
    }
}


function getCertKey(dir: string) {
    if (!isDir(dir)) return
    const cert = tryReadFile(dir + '/cert.pem')
    const key = tryReadFile(dir + '/key.pem')
    if (cert == null || key == null) return
    return {
        cert,
        key
    }
}

function tryReadFile(path: string) {
    try {
        return readFileSync(path)
    } catch (e) {
        if (e instanceof Error) {
            console.warn(e.message)
        } else console.log(e)
    }
}

function isDir(path: string) {
    try {
        const stat = lstatSync(path)
        if (stat.isDirectory()) return true
    } catch { }
    console.warn(`Not a Directory: ${path}`)
    return false
}

const defaultValues = {
    port: 8888,
    cache: 3600
}

const par = { ...defaultValues, ...params, sslConfig: ssl }

export default par