import { platform } from 'os'

const obsPath: { [key: string]: { path: string, cwd: string } | string } = {
    win32: { path: 'obs64.exe', cwd: 'C:/Program Files/obs-studio/bin/64bit' },
    linux: 'obs',
    darwin: '/Applications/OBS.app/Contents/MacOS/OBS'
}

export async function openOBS({ path, profile, scene, min, cwd, args = [] }: { path?: string | boolean, profile?: string, scene?: string, min?: boolean, cwd?: string, args?: string[] } = {}) {
    const os = platform()
    if (path === false) return
    if (path === true || path === '') path = undefined

    const temp = obsPath[os]
    if (temp == null) console.warn(`The platform ${os} does not have a default path`)

    if (typeof temp === 'string') {
        path = path ?? temp
    } else if (temp != null) {
        path = path ?? temp.path
        cwd = cwd ?? temp.cwd
    }

    if ((typeof path !== 'string') || path.length === 0) throw new Error('OBS Path is undefiled')

    args.push('--startvirtualcam', '--disable-updater')

    if (profile != null && profile.length > 0) {
        args.push('--profile', profile)
    }
    if (scene != null && scene.length > 0) {
        args.push('--scene', scene)
    }
    if (min === true) {
        args.push(`--minimize-to-tray`)
    }

    return await cmd(path, args, cwd)
}

export function cmd(command: string, args?: string[], cwd?: string): Promise<string>
export function cmd(command: string, args: string[], cwd: string, callback: (data: string) => any): Promise<number>
export function cmd(command: string, args?: string[], cwd?: string, callback?: (data: string) => any): Promise<string | number> {
    return new Promise((res, rej) => {
        import('child_process').then(cp => {
            let result = ''
            console.log('Executing > ' + command)
            const ps = cp.spawn(command, args, { cwd })
            ps.on('message', data => {
                const str = data.toString()
                if (callback != null) callback(str)
                else result += str
            })
            ps.on('error', rej)
            ps.on('close', code => {
                if (code == null) code = 0
                if (callback != null) res(code)
                else res(result)
            })
        }).catch(rej)
    })
}

export async function open(address: string, opt?: import('open').Options) {
    const open = await import('open')
    await open(address, opt)
    console.log(`Opened '${address}'`)
}

const URL_BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
export function getRandomStr64(len: number) {
    let res = ''
    for (let i = 0; i < len; i++) {
        const index = Math.floor(Math.random() * URL_BASE64.length)
        res += URL_BASE64[index]
    }
    return res
}


export function isStringArray(val: any): val is string[] {
    if (!Array.isArray(val)) return false
    for (let i = 0; i < val.length; i++) {
        const el = val[i];
        if (typeof el !== 'string') return false
    }
    return true
}