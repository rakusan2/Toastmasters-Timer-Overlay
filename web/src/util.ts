import { IBadTimeInput, IKeyVal, ITimePreset, ISettableColours } from './types'

const timeFormat = /(\d{1,2}):(\d{1,2})/

export function getElementByID<K extends keyof HTMLElementTagNameMap>(id: string, tagName: K): HTMLElementTagNameMap[K]
export function getElementByID(id: string): HTMLElement
export function getElementByID(id: string, tagName?: string) {
    const el = document.getElementById(id)

    if (el == null) {
        throw new Error(`Invalid ID '${id}'`)
    }

    if (typeof tagName == 'string' && el.tagName != tagName.toUpperCase()) {
        throw new Error(`Invalid TagName. Got ${el.tagName} Expected ${tagName.toUpperCase()}`)
    }

    if (el.tagName == 'INPUT') {
        stopKeyPropagation(el)
    }

    return el
}

export function getFirstTextByOuterID(id: string, addMissing = true) {
    const el = getElementByID(id)
    const children = el.childNodes
    for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (child instanceof Text) {
            return child
        }
    }
    if (addMissing) {
        const child = document.createTextNode('')
        el.append(child)
        return child
    } else {
        throw new Error('No Text Found')
    }
}

export function getFirstElementByClassName(name: string): HTMLElement
export function getFirstElementByClassName(name: string, parent: Document | HTMLElement): HTMLElement
export function getFirstElementByClassName<K extends keyof HTMLElementTagNameMap>(name: string, tagName: K): HTMLElementTagNameMap[K]
export function getFirstElementByClassName<K extends keyof HTMLElementTagNameMap>(name: string, tagName: K, parent: Document | HTMLElement): HTMLElementTagNameMap[K]
export function getFirstElementByClassName(name: string, tagName?: string | Document | HTMLElement, parent: Document | HTMLElement = document) {
    if (tagName != null && typeof tagName != 'string') {
        parent = tagName
    }

    let el: Element | null
    if (typeof tagName == 'string') {
        el = parent.querySelector(`${tagName}.${name}`)
    } else {
        el = parent.getElementsByClassName(name).item(0)
    }

    if (el == null) {
        throw new Error(`Element with Class '${name}'${(typeof tagName == 'string') ? ` and Tag ${tagName}` : ''} not found`)
    }

    if (typeof tagName == 'string' && el.tagName != tagName.toUpperCase()) {
        throw new Error(`Invalid TagName. Got ${el.tagName} Expected ${tagName.toUpperCase()}`)
    }

    return el
}

export function collectionToArray<T extends Element>(col: HTMLCollectionOf<T>) {
    const len = col.length
    const res: T[] = []

    for (let i = 0; i < len; i++) {
        const el = col.item(i)
        if (el != null) {
            res.push(el)
        }
    }
    return res
}

export function fixTimeMap(presets: IKeyVal<{ [P in keyof ITimePreset]: IBadTimeInput }>): IKeyVal<ITimePreset> {
    const res: IKeyVal<ITimePreset> = {}
    for (let key in presets) {
        const { green, yellow, red, overtime } = presets[key]
        res[key] = {
            green: fixTime(green),
            yellow: fixTime(yellow),
            red: fixTime(red),
            overtime: fixTime(overtime),
        }
    }
    return res
}

export function fixTime(time: IBadTimeInput): string
export function fixTime<T>(time: IBadTimeInput, defaultVal: T): string | T
export function fixTime(time: IBadTimeInput, defaultVal: any = '00:00') {
    const ex = extractTime(time)
    if (ex == null) {
        return defaultVal
    } else {
        return `${ex.min}:${ex.s}`
    }
}
export function extractTime(time: IBadTimeInput) {
    if (time == null) return null
    const m = (typeof time === 'string' ? time.match(timeFormat) : null)
    if (m == null) {
        let t = +time
        if (Number.isNaN(t) || t < 0) {
            return null
        } else {
            const sec = t % 60
            const min = (t - sec) / 60
            return { s: sec.toFixed(0).padStart(2, '0'), min: min.toFixed(0).padStart(2, '0') }
        }
    } else {
        return { s: m[2].padStart(2, '0'), min: m[1].padStart(2, '0') }
    }
}

export function minSecToMS(val: string) {
    let m = val.match(timeFormat)
    if (m == null) {
        return 0
    } else {
        let [, min, sec] = m
        return ((+min * 60) + +sec) * 1000
    }
}

export function timePresetStringToMs(val: ITimePreset): { [P in keyof ITimePreset]: number } {
    return {
        green: minSecToMS(val.green),
        yellow: minSecToMS(val.yellow),
        red: minSecToMS(val.red),
        overtime: minSecToMS(val.overtime)
    }
}

export function fixedDigits(num: number, count: number) {
    return num.toFixed(0).padStart(count, '0')
}

export function msToMinSecStr(totalMs: number) {

    const totalSec = Math.floor(totalMs / 1000)
    const sec = totalSec % 60
    const min = Math.floor(totalSec / 60)
    
    return `${fixedDigits(min, 2)}:${fixedDigits(sec, 2)}`
}

export function stopKeyPropagation<T extends HTMLElement>(el: T) {
    el.addEventListener('keydown', function(ev) {
        ev.stopPropagation()
    })
    el.addEventListener('keyup', function(ev) {
        ev.stopPropagation()
    })
    return el
}

const settableColors = ['white', 'green', 'yellow', 'red']

export function isSettableColor(val: any): val is ISettableColours {
    return typeof val == 'string' && settableColors.includes(val)
}
