import { platform } from 'os'

const obsPath: { [key: string]: { path: string, cwd: string } | string } = {
    win32: { path: 'obs64.exe', cwd: 'C:/Program Files/obs-studio/bin/64bit' },
    linux: 'obs', //TODO Change to correct location
    darwin: '/Applications/OBS.app/Contents/MacOS/OBS'
}

export async function openOBS({ path, profile, scene, min, cwd }: { path?: string | boolean, profile?: string, scene?: string, min?: boolean, cwd?: string } = {}) {
    const os = platform()
    if (path == null || path == '' || path === true) {
        const temp = obsPath[os]
        if (typeof temp === 'string') path = temp
        else {
            path = temp.path
            cwd = temp.cwd
        }
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

    return await cmd(command, cwd)
}

export function cmd(command: string, cwd?: string) {
    return new Promise<string>((res, rej) => {
        import('child_process').then(cp => {
            console.log('Executing > ' + command)
            cp.exec(command, { windowsHide: true, cwd }, (err, data) => {
                if (err != null) {
                    rej(err)
                } else res(data)
            })
        }).catch(rej)
    })
}

export async function open(address: string, opt?: import('open').Options) {
    const open = await import('open')
    if (opt != null) {
        await open(address, opt)
    } else {
        await open(address)
    }
    console.log(`Opened '${address}'`)
}

const URL_BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
export function getRandomStr64(len: number) {
    let res = ''
    for (let i = 0; i < len; i++) {
        const index = Math.round(Math.random() * (URL_BASE64.length - 1))
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