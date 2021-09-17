import { IKeyVal } from './types';

const settings: IKeyVal<IKeyVal<any>> = {}
const updateFuncs: IKeyVal<IUpdateFunc[]> = {}
const commonUpdateFuncs: IUpdateFunc[] = []
type IUpdateFunc = (id: string, data: IKeyVal<any>) => void

export function onUpdate(func: IUpdateFunc, ids?: string[]) {
    if (ids == null) {
        commonUpdateFuncs.push(func)
    }
    else for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const user = updateFuncs[id]
        if (user == null) updateFuncs[id] = [func]
        else user.push(func)
    }
}

export class Settings {
    data: IKeyVal<any>
    onUpdate: IUpdateFunc[]
    constructor(public id: string, objDefault?: IKeyVal<any>) {
        if (typeof id !== 'string' || id.length === 0) throw new Error('Invalid ID')
        const user = settings[id]
        const funcs = updateFuncs[id]
        if (user == null) {
            this.data = settings[id] = objDefault ?? {}
            if (funcs == null) this.onUpdate = updateFuncs[id] = []
            else this.onUpdate = funcs
        } else {
            this.data = user
            this.onUpdate = updateFuncs[id]
        }
    }
    set(val: IKeyVal<any>) {
        const notSet: string[] = []
        const diffObject: IKeyVal<any> = {}
        const entries = Object.entries(val)
        const data = this.data
        for (let i = 0; i < entries.length; i++) {
            const [key, value] = entries[i];
            if (!setVal(data, key, value)) notSet.push(key)
            else diffObject[key] = value
        }

        if (notSet.length != entries.length) {
            const id = this.id
            this.onUpdate.forEach(func => func(id, data))
            commonUpdateFuncs.forEach(func => func(id, data))
        }
        return {
            keysNotSet: notSet,
            keysSet: diffObject
        }
    }
    get(key?: string | string[]) {
        if (key == null) return this.data
        if (typeof key === 'string') {
            return getVal(this.data, key)
        }
        return key.map(a => getVal(this.data, a))
    }
    getObj(key?: string | string[]) {
        if (key == null) return this.data
        if (typeof key === 'string') {
            return { [key]: getVal(this.data, key) }
        }
        const res: IKeyVal<any> = {}
        for (let i = 0; i < key.length; i++) {
            const el = key[i];
            res[el] = getVal(this.data, el)
        }
        return res
    }
}

export function getAll() {
    return settings
}

function getVal(obj: IKeyVal<any>, key: string) {
    if (key.includes('|') || key.includes('.')) {
        let val = obj as any
        const arr = getKeyArr(key)
        for (let i = 0; i < arr.length; i++) {
            if (val == null || typeof val !== 'object') return null
            const { key, isArr } = arr[i];
            if (isArr && !Array.isArray(val)) return null
            val = val[key]
        }
        return val
    } else return obj[key]
}

function setVal(obj: IKeyVal<any>, key: string, value: any) {
    if (key.includes('|') || key.includes('.')) {
        const arr = getKeyArr(key)
        let val = obj as any
        let i = 0
        const lastIndex = arr.length - 1
        for (; i < lastIndex; i++) {
            const { key, isArr } = arr[i];
            if (isArr && !Array.isArray(val)) return false
            const temp = val[key]
            if (temp == null) {
                val = val[key] = (arr[i + 1].isArr === true ? [] : {})
            } else if (typeof temp == 'object') {
                val = temp
            } else return false
        }
        const { key: objKey, isArr } = arr[lastIndex]
        if (isArr && !Array.isArray(val)) return false
        val[objKey] = value
    } else obj[key] = value
    return true
}

function getKeyArr(key: string) {
    let str = ''
    let isIndex = false
    let isEscape = false
    const res: ({ key: string, isArr?: false } | { key: number, isArr: true })[] = []
    for (let i = 0; i < key.length; i++) {
        const char = key[i];
        if (isEscape) {
            if (char !== '.' && char !== '|') str += '\\'
            str += char
            isEscape = false
        } if (char === '\\') {
            isEscape = true
        }
        if (char === '|') {
            if (str.length === 0) continue
            if (isIndex) {
                const index = getIndex(str)
                if (index == null) res.push({ key: str })
                else res.push({ key: index, isArr: true })
            } else {
                res.push({ key: str })
                isIndex = true
            }
            str = ''
        } else if (char === '.') {
            if (str.length === 0) continue
            if (isIndex) {
                isIndex = false
                const index = getIndex(str)
                if (index == null) res.push({ key: str })
                else res.push({ key: index, isArr: true })
            } else {
                res.push({ key: str })
            }
            str = ''
        } else {
            str += char
        }
    }
    if (str.length === 0) return res
    if (isIndex) {
        const index = getIndex(str)
        if (index == null) res.push({ key: str })
        else res.push({ key: index, isArr: true })
    } else {
        res.push({ key: str })
    }
    return res
}

function getAtIndex(val: any, key: string) {
    if (val == null || !Array.isArray(val)) return null
    const num = +key
    if (!Number.isSafeInteger(num)) return null
    if (num < 0 || val.length >= num) return null
    return val[num]
}

function getIndex(key: string) {
    const num = +key
    if (!Number.isSafeInteger(num)) return null
    if (num < 0) return null
    return num
}