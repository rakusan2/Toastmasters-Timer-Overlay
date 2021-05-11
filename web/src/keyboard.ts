import { IKeyVal } from './types'

//type functionEnabler =  {disable():any, enable():any, isEnabled:Readonly<boolean>}
type keyAnyFun = (down: boolean, ev: KeyboardEvent) => any
//type keyAnyFunRet = keyAnyFun & functionEnabler
type keyFun = (ev: KeyboardEvent) => any
//type keyFunRet = keyFun & functionEnabler

const handlers: IKeyVal<{ down?: { fun: keyFun, repeat: boolean }, up?: keyFun, any?: { fun: keyAnyFun, repeat: boolean } }> = {}

function addDown(key: string, repeat: boolean, fun: keyFun) {
    if (typeof handlers[key] === 'undefined') {
        handlers[key] = {}
    }
    const handler = handlers[key]
    if (typeof handler.any != 'function' && typeof handler.down != 'function') {
        handler.down = { fun, repeat }
        return
    }
    throw new Error(`Key '${key}' already has a Down Handler`)
}
function addUp(key: string, fun: keyFun) {
    if (typeof handlers[key] === 'undefined') {
        handlers[key] = {}
    }
    const handler = handlers[key]
    if (typeof handler.any != 'function' && typeof handler.up != 'function') {
        handler.up = fun
        return
    }
    throw new Error(`Key '${key}' already has a Up Handler`)
}
function addAny(key: string, repeat: boolean, fun: keyAnyFun) {
    if (typeof handlers[key] === 'undefined') {
        handlers[key] = {}
    }
    const handler = handlers[key]
    if (typeof handler.down != 'function' && typeof handler.up != 'function' && typeof handler.any != 'function') {
        handler.any = { fun, repeat }
        return
    }
    throw new Error(`Key '${key}' already has a Handler`)
}

export function onKeyDown(key: string | string[], fun: keyFun): keyFun
export function onKeyDown(key: string | string[], repeat: boolean, fun: keyFun): keyFun
export function onKeyDown(key: string | string[], repeat: boolean | keyFun, fun?: keyFun) {
    if (typeof repeat === 'function') {
        fun = repeat
        repeat = false
    }
    if (typeof fun !== 'function') {
        throw new Error('No function passed')
    }
    if (Array.isArray(key)) {
        for (let i = 0; i < key.length; i++) {
            addDown(fixKeyStr(key[i]), repeat, fun)
        }
    } else {
        addDown(fixKeyStr(key), repeat, fun)
    }
    return fun
}

export function onKeyUp(key: string | string[], fun: keyFun) {

    if (typeof fun !== 'function') {
        throw new Error('No function passed')
    }
    if (Array.isArray(key)) {
        for (let i = 0; i < key.length; i++) {
            addUp(fixKeyStr(key[i]), fun)
        }
    } else {
        addUp(fixKeyStr(key), fun)
    }
    return fun
}

export function onKey(key: string | string[], fun: keyAnyFun): keyAnyFun
export function onKey(key: string | string[], repeat: boolean, fun: keyAnyFun): keyAnyFun
export function onKey(key: string | string[], repeat: boolean | keyAnyFun, fun?: keyAnyFun) {
    if (typeof repeat === 'function') {
        fun = repeat
        repeat = false
    }
    if (typeof fun !== 'function') {
        throw new Error('No function passed')
    }
    if (Array.isArray(key)) {
        for (let i = 0; i < key.length; i++) {
            addAny(fixKeyStr(key[i]), repeat, fun)
        }
    } else {
        addAny(fixKeyStr(key), repeat, fun)
    }
    return fun
}

function fixKeyStr(key: string) {
    const parts = key.split('+').map(a => a.trim().toLowerCase())
    const shift = parts.includes('shift')
    const ctrl = parts.includes('control') || parts.includes('ctrl')
    const alt = parts.includes('alt')

    const res = []

    if (alt) res.push('alt')
    if (ctrl) res.push('control')
    if (shift) res.push('shift')

    const rest = parts.filter(a => a.length == 0 || !(['shift', 'alt', 'ctrl', 'control'].includes(a)))

    if (rest.some(a => a.length > 1)) {
        throw new Error(`Unknown key '${rest.find(a => a.length > 1)}'`)
    }
    res.push(...rest.sort())

    return res.join('+')
}

const keysPressed = new Set<string>()

document.addEventListener('keydown', ev => {
    const key = ev.key.toLowerCase()
    keysPressed.add(key)
    const keys = Array.from(keysPressed)
    callHandlers(keys, true, ev)
})

document.addEventListener('keyup', ev => {
    const key = ev.key.toLowerCase()
    const keys = Array.from(keysPressed)
    keysPressed.delete(key)
    callHandlers(keys, false, ev)
})

function callHandlers(keys: string[], down: boolean, ev: KeyboardEvent) {
    keys.sort()
    const isRepeat = ev.repeat
    const control = keys.filter(a => a.length > 1)
    const chars = keys.filter(a => a.length === 1)
    const callable = new Set<keyFun>()
    const callableBoth = new Set<keyAnyFun>()
    const { tagName } = (ev.target as HTMLElement) ?? {}

    if(tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return

    if (!isRepeat) {
        console.log({ key: ev.key.toLowerCase(), down })
    }

    for (let i = 0; i < chars.length; i++) {
        const res = [...control, chars[i]].join()
        if (typeof handlers[res] != 'undefined') {
            const handler = handlers[res]
            if (down && typeof handler.down != 'undefined') {
                if (isRepeat !== true || handler.down.repeat === true) {
                    callable.add(handler.down.fun)
                }
            } else if (!down && typeof handler.up === 'function') {
                callable.add(handler.up)
            } else if (typeof handler.any !== 'undefined') {
                if (isRepeat !== true || handler.any.repeat === true) {
                    callableBoth.add(handler.any.fun)
                }
            }
        }
    }
    callable.forEach(a => a(ev))
    callableBoth.forEach(a => a(down, ev))
}

export function isPressed(val: number | string) {
    let key = typeof val === 'number' ? String.fromCharCode(val) : val
    key = key.toLowerCase()
    if (key === 'ctrl') key = 'control'
    return keysPressed.has(key)
}