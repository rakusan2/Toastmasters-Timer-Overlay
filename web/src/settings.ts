import { IKeyVal, IResponseSet, ISettingInput, ISettingKeys, IMayArr } from './types'
import { send } from './socket'
import { defaultSettings } from './constants'

const afterSet: (() => any)[] = []
const settings: IKeyVal<{ afterSet: (() => any)[], value: any, fun: ((value: any, key: string) => any)[] }> = {}

export function onSetting<T extends ISettingKeys>(keys: T[], fun: (val: any, key: T) => any): (val: any, key: T) => any
export function onSetting<T extends keyof ISettingInput>(key: T, fun: (val: ISettingInput[T], key: T) => any): (val: ISettingInput[T], key: T) => any
export function onSetting(keys: IMayArr<ISettingKeys>, fun: (val: any, key: string) => any): (val: any, key: string) => any {

    if (Array.isArray(keys)) {
        keys.forEach(key => {
            if (!(key in settings)) {
                settings[key] = { afterSet: [], value: null, fun: [fun] }
            } else {
                settings[key].fun.push(fun)
            }
        })
    } else {
        if (!(keys in settings)) {
            settings[keys] = { afterSet: [], value: null, fun: [fun] }
        } else {
            settings[keys].fun.push(fun)
        }
    }
    return fun
}

export function setting(keys: IMayArr<ISettingKeys>): MethodDecorator {

    function addFun(key: ISettingKeys, fun: (val: any, key: string) => any) {
        if (typeof settings[key] == 'undefined') {
            settings[key] = { afterSet: [], fun: [fun], value: null }
        } else {
            settings[key].fun.push(fun)
        }
    }

    return function(this: any, _target, _key, descriptor) {

        // TODO Test this
        debugger;
        if (descriptor.value != null) {
            const fun = (<unknown>descriptor.value as (val: any, key?: string) => any).bind(this)

            if (Array.isArray(keys)) {
                keys.forEach(key => {
                    addFun(key, fun)
                })
            } else {
                addFun(keys, fun)
            }
        }

    }
}

export function afterSetting(keys?: IMayArr<ISettingKeys>): MethodDecorator {
    function addFun(key: ISettingKeys, fun: () => any) {
        if (typeof settings[key] == 'undefined') {
            settings[key] = { afterSet: [fun], fun: [], value: null }
        } else {
            settings[key].afterSet.push(fun)
        }
    }
    return function(this: any, _target, _key, descriptor) {
        // TODO Test this
        if (descriptor.value != null) {
            const fun = (<unknown>descriptor.value as () => any).bind(this)
            if (keys == null) {
                afterSet.push(fun)
            } else if (Array.isArray(keys)) {
                keys.forEach(key => {
                    addFun(key, fun)
                })
            } else {
                addFun(keys, fun)
            }
        }

        return descriptor
    }
}

export async function setSetting<T extends keyof ISettingInput>(key: T, value: ISettingInput[T], send = true, doAfterSet = true) {
    if (key in settings && settings[key].fun.length > 0) {
        settings[key].value = value
        settings[key].fun.forEach(a => a(value, key))
    } else {
        throw new Error(`Can not set setting for key '${key}'`)
    }

    if (doAfterSet) {
        runAfterSet([key])
    }

    if (send) {
        const notSet = await sendSettings({ [key]: value })
        return notSet.length == 0
    }
    return true
}
export async function setSettings(toSet: ISettingInput, send = true, doAfterSet = true) {
    for (const key in toSet) {
        setSetting(key, toSet[key], false, false)
    }

    if (doAfterSet) {
        runAfterSet(Object.keys(toSet))
    }

    if (send) {
        const notSet = await sendSettings(toSet)
        return notSet.length
    }
    return 0
}

function runAfterSet(keys: string[]) {
    const toRun: Set<() => any> = new Set(afterSet)

    function addFuncs(funcs: (() => any)[]) {
        funcs.forEach(a => toRun.add(a))
    }

    keys.forEach(key => {
        if (key in settings) {
            addFuncs(settings[key].afterSet)
        }
    })
    window.setTimeout(() => {
        toRun.forEach(fun => fun())
    })
}

async function sendSettings(settings: ISettingInput) {
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
    setSettings({ ...val, ...defaultSettings })
}