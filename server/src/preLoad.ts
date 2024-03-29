import { getParams } from 'dl-args';
import { readFileSync, lstatSync } from 'fs';
import { networkInterfaces } from 'os'

export default getParams([
    {
        name: 'port',
        shortName: 'p',
        description: 'Website Port',
        type: 'number',
        validateRaw: /^\d{2,6}$/,
        default: 8888
    },
    {
        name: 'cache',
        description: 'Set Client side cache duration\nCan be disabled with `false`',
        type: ['number', 'boolean'],
        replace: (val: boolean | number) => (typeof val !== 'boolean') ? val : val ? 3600 : null,
        validate: (val: number | null) => {
            if (val == null) return true
            if (val <= 10) return 'Cache Age is too short'
        },
        default: 3600
    },
    {
        name: 'one-id',
        shortName: 'i',
        description: 'Only allow a single id\nSetting a string will set a specific id',
        type: encodeURIComponent,
        switchValue: 'aaaa',
        propertyName: 'oneID',
        validate: validateID
    },
    {
        name: 'open',
        shortName: 'o',
        description: 'Open a browser page',
        type: 'string',
        switchValue: true
    },
    {
        groupName: 'obs',
        description: 'OBS Studio settings\nSettings any of these will open OBS Studio',
        parameters: [
            {
                name: 'path',
                alias: 'obs',
                shortName: 'b',
                description: 'Path to OBS Executable',
                type: 'string',
                switchValue: true,
                default: true
            },
            {
                name: 'cwd',
                description: 'Path from where to start OBS Studio',
                type: 'string'
            },
            {
                name: 'profile',
                type: 'string'
            },
            {
                name: 'scene',
                type: 'string'
            },
            {
                name: 'minimize',
                alias: 'obs-min',
                description: 'Start OBS Studio Minimized to Tray',
                switchValue: true,
                propertyName: 'min'
            }
        ]
    },
    {
        name: 'ssl',
        description: 'Set path to folder with HTTPS Certificate and Key',
        type: getCertKey,
        validate: isNotNull
    },
    {
        groupName: 'ssl',
        description:'Set HTTPS Certificate and Key individually\nWarning Both need to be set to not throw an error',
        propertyName: 'sslConfig',
        parameters: [
            {
                name: 'cert',
                type: tryReadFile,
                validate: isNotNull
            },
            {
                name: 'key',
                type: tryReadFile,
                validate: isNotNull
            }
        ],
        finalize: finalizeSslConfig
    },
    {
        groupName: 'udp',
        parameters: [
            {
                name: 'port',
                alias: 'udp',
                shortName: 'u',
                description: 'Requests for current timing info can be sent to this port\nCheck documentation on how to structure this packet',
                type: 'number',
                validateRaw: /^\d{2,6}$/,
                switchValue: 8889
            },
            {
                name: 'interface',
                alias: 'udp-if',
                type: replaceInterface,
                validate: validateInterface,
            },
        ]
    },
    {
        name: 'broadcast',
        type: 'number',
        description:'Broadcast timing info to all on local network listening on set port\nDefault is 8890',
        validateRaw: /^\d{2,6}$/,
        switchValue: 8890,
        group: 'udp',
        propertyName: 'broadcast'
    },
    {
        name: 'broadcast-user',
        alias: 'b-user',
        description:'Limit broadcast to specific ids',
        type: encodeURIComponent,
        group: 'udp',
        propertyName: 'user',
        validate: validateID,
        multiple: true
    },
    {
        groupName: 'tcp',
        parameters: [
            {
                name: 'port',
                alias: 'tcp',
                shortName: 't',
                description: 'Same as udp-port',
                type: 'number',
                validateRaw: /^\d{2,6}$/,
                switchValue: 8891,
                default: 8891
            },
            {
                name: 'interface',
                type: replaceInterface,
                validate: validateInterface
            }
        ]
    }
]) as {
    port: number
    cache: number | null
    oneID?: string
    open?: string | true
    obs?: {
        path: string | true
        cwd?: string
        scene?: string
        profile?: string
        min?: true
    }
    sslConfig?: {
        cert: string
        key: string
    }
    udp?: {
        port?: number
        broadcast?: number
        user?: string[],
        interface?: string
    }
    tcp?: {
        port: number,
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

function finalizeSslConfig(val: { cert?: Buffer, key?: Buffer }) {
    if (val.cert == null) throw new Error('Invalid SSL Certificate')
    if (val.key == null) throw new Error('Invalid SSL key')

    return val
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
function isNotNull(val: any) {
    return val != null
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