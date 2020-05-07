import { IKeyVal, IResponseSet, ISettingInput, ISettingKeys, IMayArr, IMethodDecorator, ISettingInputKnown } from './types'
import { send } from './socket'
import { defaultSettings } from './constants'

const afterSet: (() => any)[] = []
const settings: IKeyVal<{ value: any, funcs: { afterSet: (() => any)[], fun: ((value: any, key: string) => any)[], caller: any }[] }> = {}

export function onSetting<T extends keyof ISettingInputKnown>(key: T, fun: (val: ISettingInputKnown[T], key: T) => any, caller: any): (val: ISettingInput[T], key: T) => any
export function onSetting(keys: IMayArr<ISettingKeys>, fun: (val: any, key: string) => any, caller: any): (val: any, key: string) => any {

    function add(key: string) {
        if (!(key in settings)) {
            settings[key] = { value: null, funcs: [{ afterSet: [], fun: [fun], caller }] }
        } else {
            const funcs = settings[key].funcs.find(a => a.caller === caller)
            if (funcs == null) {
                settings[key].funcs.push({ afterSet: [], fun: [fun], caller })
            } else {
                funcs.fun.push(fun)
            }
        }
    }

    if (Array.isArray(keys)) {
        keys.forEach(key => {
            add(key)
        })
    } else {
        add(keys)
    }
    return fun
}

/* Does Not Work */
// export function _setting(keys: IMayArr<ISettingKeys>): IMethodDecorator<(val: any, key?: string) => any> {

//     function addFun(key: ISettingKeys, fun: (val: any, key: string) => any) {
//         if (typeof settings[key] == 'undefined') {
//             settings[key] = { afterSet: [], fun: [fun], value: null }
//         } else {
//             settings[key].fun.push(fun)
//         }
//     }

//     return function(this: any, _target, decKey, descriptor) {

//         if (descriptor.value != null) {

//             const value = descriptor.value

//             delete descriptor.value
//             delete descriptor.writable
//             descriptor.get = function() {
//                 debugger
//                 const fun = value.bind(this)

//                 Object.defineProperty(this, decKey, {
//                     enumerable: descriptor.enumerable,
//                     configurable: descriptor.configurable,
//                     value: fun
//                 })

//                 if (Array.isArray(keys)) {
//                     keys.forEach(key => {
//                         addFun(key, fun)
//                     })
//                 } else {
//                     addFun(keys, fun)
//                 }
//                 return this[name]
//             }


//         }

//     }
// }

export function afterSetting(fun: () => any, caller: any): () => any
export function afterSetting(keys: IMayArr<ISettingKeys>, fun: () => any, caller: any): () => any
export function afterSetting(keys: IMayArr<ISettingKeys> | (() => any) | null, fun: () => any | any, caller?: any): () => any {
    function addFun(key: ISettingKeys, fun: () => any) {
        if (typeof settings[key] == 'undefined') {
            settings[key] = { value: null, funcs: [{ afterSet: [fun], fun: [], caller }] }
        } else {
            const funcs = settings[key].funcs.find(a => a.caller === caller)
            if (funcs == null) {
                settings[key].funcs.push({ afterSet: [fun], fun: [], caller })
            } else {
                funcs.afterSet.push(fun)
            }
        }
    }

    if (typeof keys === 'function') {
        caller = fun
        fun = keys
        keys = null
    }
    if (fun == null) {
        return () => { }
    }

    if (keys == null) {
        afterSet.push(fun)
    } else if (Array.isArray(keys)) {
        for (let i = 0; i < keys.length; i++) {
            addFun(keys[i], fun)
        }
    } else {
        addFun(keys, fun)
    }
    return fun
}

/* Does Not Work */
// export function _afterSetting(keys?: IMayArr<ISettingKeys>): IMethodDecorator<() => any> {
//     function addFun(key: ISettingKeys, fun: () => any) {
//         if (typeof settings[key] == 'undefined') {
//             settings[key] = { afterSet: [fun], fun: [], value: null }
//         } else {
//             settings[key].afterSet.push(fun)
//         }
//     }
//     return function(this: any, _target, decKey, descriptor) {

//         if (descriptor.value != null) {

//             const value = descriptor.value

//             delete descriptor.value
//             delete descriptor.writable
//             descriptor.get = function() {
//                 const fun = value.bind(this)

//                 Object.defineProperty(this, decKey, {
//                     enumerable: descriptor.enumerable,
//                     configurable: descriptor.configurable,
//                     value: fun
//                 })

//                 if (keys == null) {
//                     afterSet.push(fun)
//                 } else if (Array.isArray(keys)) {
//                     keys.forEach(key => {
//                         addFun(key, fun)
//                     })
//                 } else {
//                     addFun(keys, fun)
//                 }
//                 return this[name]
//             }


//         }

//         return descriptor
//     }
// }

// TODO Implement don't send on bad value

export async function setSetting<T extends keyof ISettingInputKnown>(key: T, value: ISettingInputKnown[T], send?: boolean, doAfterSet?: boolean, caller?: any): Promise<boolean>
export async function setSetting<T extends string>(key: T, value: any, send?: boolean, doAfterSet?: boolean, caller?: any): Promise<boolean>
export async function setSetting(key: string, value: any, send = true, doAfterSet = true, caller?: any) {
    console.log({ set: key, val: value })
    if (key in settings && settings[key].funcs.some(a => a.fun.length > 0)) {
        settings[key].value = value
        settings[key].funcs.forEach(a => a.fun.forEach(b => b(value, key)))
    } else {
        console.warn(`Can not set setting '${key}'`)
        return false
    }

    if (doAfterSet) {
        runAfterSet([key], caller)
    }

    if (send) {
        const notSet = await sendSettings({ [key]: value })
        return notSet.length == 0
    }
    return true

}
export async function setSettings(toSet: ISettingInputKnown, send?: boolean, doAfterSet?: boolean, caller?: any): Promise<number>
export async function setSettings(toSet: IKeyVal<any>, send = true, doAfterSet = true, caller?: any) {
    for (const key in toSet) {
        setSetting(key, toSet[key], false, false)
    }

    if (doAfterSet) {
        runAfterSet(Object.keys(toSet), caller)
    }

    if (send) {
        const notSet = await sendSettings(toSet)
        return notSet.length
    }
    return 0
}
function runAfterSet(keys: string[], caller?: any) {
    const toRun: Set<() => any> = new Set(afterSet)

    function addFuncs(funcs: (() => any)[]) {
        funcs.forEach(a => toRun.add(a))
    }

    keys.forEach(key => {
        if (key in settings) {
            if(caller == null){
                settings[key].funcs.forEach(a=> addFuncs(a.afterSet))
            }
            settings[key].funcs.forEach(a=>{
                if(a.caller === caller)return
                addFuncs(a.afterSet)
            })
        }
    })
    window.setTimeout(() => {
        toRun.forEach(fun => fun())
    })
}

export async function sendSettings(settings: ISettingInputKnown) {
    const resp = await send('set', settings)
    if (resp.ok) {
        resp.keysNotSet.forEach(key => {
            console.warn(`Key '${key}' was not set`)
        })
        return resp.keysNotSet
    } else {
        console.error(resp.err)
    }
    return []
}

export function initSettings(val: ISettingInput) {
    setSettings({ ...val, ...defaultSettings }, false)
}

export class Settings {
    on<T extends keyof ISettingInputKnown>(key: T, fun: (val: ISettingInputKnown[T], key: T) => any): (val: ISettingInput[T], key: T) => any {
        return onSetting(key, fun, this)
    }
}