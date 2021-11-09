import { IKeyVal } from './types'

/**
 * Turns process.argv to an object
 */
export function getParams(configPar: (ParamConfig | ParamGroupConfig | string)[], options?: ParamReaderConfig) {
    let args = options?.source ?? process.argv.splice(2)
    if (args.length === 0 && options?.defaultSource != null) args = options.defaultSource

    const [config, finFuncs] = replaceStringAndGroupConfig(configPar)
    const shortTree = config.reduce((tree, val) => addToTree(tree, val), { char: {} } as ITree)
    const res: IKeyVal<any> = {}
    const { caseSensitive = false, disableDashlessMode = false, disableDashedMode = false } = options ?? {}
    const hasDash = disableDashlessMode || args.some(a => a[0] === '-')
    if (disableDashedMode && disableDashlessMode) throw new Error('Both modes of operation were disabled')

    for (let i = 0; i < args.length; i++) {
        let arg = args[i];
        if (arg.length === 0) continue
        if (!disableDashedMode && arg[0] === '-') {
            if (arg.length === 1) continue
            if (arg[1] === '-') {
                if (arg.length === 2) continue
                arg = arg.slice(2)
                const { conf, val } = getConfVal(config, arg, caseSensitive)
                if (typeof conf === 'string') throw new Error('Unknown parameter ' + conf)
                if (canGetVal(conf)) {
                    if (val != null) {
                        assignValue(res, conf, caseSensitive, val)
                        continue
                    }
                    let nextArg = args.length === i + 1 ? null : args[i + 1]
                    if (nextArg == null || nextArg[0] === '-') {
                        if (requiresVal(conf)) throw new MissingValueError(conf)
                        nextArg = null
                    } else i++
                    assignValue(res, conf, caseSensitive, nextArg)
                } else if (val != null) {
                    throw new AssignValueError(conf, val)
                }
                else {
                    assignValue(res, conf, caseSensitive, null)
                }
            } else {
                let index = 1
                let lastRequireVal = false
                let lastConf: null | ParamConfig = null
                while (true) {
                    const branch = getFromTree(shortTree, arg, index)
                    if (branch == null) throw new Error(`Invalid Short Name ${arg} at index ${index}`)
                    if (lastRequireVal && lastConf != null) {
                        throw new MissingValueError(lastConf)
                    }
                    const conf = branch.config

                    lastConf = conf
                    lastRequireVal = requiresVal(conf)
                    index = branch.index
                    if (index >= arg.length || arg[index] === '=') break
                    assignValue(res, conf, caseSensitive, null)
                }
                if (arg[index] === '=') {
                    assignValue(res, lastConf, caseSensitive, arg.slice(index + 1))
                }
                else if (canGetVal(lastConf)) {
                    let nextArg
                    if (i + 1 < args.length) nextArg = args[i + 1]
                    if (nextArg == null || nextArg[0] === '-') nextArg = null
                    else i++
                    assignValue(res, lastConf, caseSensitive, nextArg)
                } else assignValue(res, lastConf, caseSensitive, null)
            }
            continue
        }
        if (hasDash) {
            assignNextValue(res, config, caseSensitive, arg)
        } else {
            const { conf, val } = getConfVal(config, arg, true)
            if (typeof conf === 'string') {
                if (val != null) throw new Error('Unknown parameter ' + conf)
                assignNextValue(res, config, caseSensitive, arg)
            } else if (val == null && conf.switchValue == null) {
                assignNextValue(res, config, caseSensitive, arg)
            } else {
                assignValue(res, conf, caseSensitive, val)
            }
        }
    }

    setDefaults(res, config)

    for (let i = 0; i < finFuncs.length; i++) {
        const { name, func } = finFuncs[i]
        if (name in res) {
            res[name] = func(res[name])
        }
    }

    return res
}

function setDefaults(obj: IKeyVal<any>, config: ParamConfig[]) {
    for (let i = 0; i < config.length; i++) {
        const conf = config[i]
        if (conf.default == null) continue
        const name = conf.propertyName ?? conf.name
        const group = conf.group
        const createGroup = conf.defaultCreateGroup ?? false
        if (group == null) {
            if (name in obj) continue
            obj[name] = conf.default
        } else if (Array.isArray(group)) {
            for (let groupI = 0; groupI < group.length; groupI++) {
                const groupName: string = group[groupI]
                if (groupName in obj) {
                    const temp = obj[groupName]
                    if (temp != null && (typeof temp === 'object') && !(name in temp)) {
                        temp[name] = conf.default
                    }
                } else if (createGroup) {
                    obj[groupName][name] = { [name]: conf.default }
                }
            }
        } else if (group in obj) {
            const temp = obj[group]
            if (temp != null && (typeof temp === 'object') && !(name in temp)) {
                temp[name] = conf.default
            }
        } else if (createGroup) {
            obj[group][name] = { [name]: conf.default }
        }
    }
}

function replaceStringAndGroupConfig(config: (ParamConfig | ParamGroupConfig | string)[], options?: ParamReaderConfig): [ParamConfig[], { name: string, func: (val: any) => any }[]] {
    const res: ParamConfig[] = []
    const finFuncs: { name: string, func: (val: any) => any, required?: string[] }[] = []
    for (let i = 0; i < config.length; i++) {
        const el = config[i];
        if (typeof el === 'string') res[i] = { name: el, type: 'string' }
        else if ('groupName' in el) {
            const groupName = el.groupName
            const groupPropName = el.propertyName ?? groupName
            const groupProps = el.parameters
            if (el.finalize != null) finFuncs.push({ name: groupPropName, func: el.finalize })
            if (groupProps != null) for (let propI = 0; propI < groupProps.length; propI++) {
                const prop = groupProps[propI];
                if (typeof prop === 'string') {
                    res.push({ name: groupName + '-' + prop, type: 'string', group: groupPropName, propertyName: prop })
                } else {
                    const temp: ParamConfig = { ...prop, name: groupName + '-' + prop.name, group: groupPropName, propertyName: prop.propertyName ?? prop.name }
                    res.push(assertAndFixConfig(temp, options))
                }
            }
        }
        else res.push(assertAndFixConfig(el, options))
    }
    return [res, finFuncs]
}

interface ITree {
    char: IKeyVal<ITree>
    val?: ParamConfig
}

export class MissingValueError extends Error {
    constructor(public conf: ParamConfig) {
        super(`${conf.name} ${conf.shortName == null ? '' : `(-${conf.shortName}) `}requires value with ${getConfTypeString(conf)}`)
    }
}
export class AssignValueError extends Error {
    constructor(public conf: ParamConfig, value?: string) {
        super(`${conf.name}${conf.shortName == null ? '' : ` (-${conf.shortName})`}: trying to assign "${value ?? 'null'}" to ${getConfTypeString(conf)}`)
    }
}

function getConfVal(configs: ParamConfig[], str: string, caseSensitive: boolean, checkShort?: boolean) {
    let match: null | RegExpExecArray = null,
        name: string,
        val: string | null = null

    if (str.includes('=') && (match = /^([^=]*)=(.*)$/.exec(str)) != null) {
        name = match[1]
        val = match[2]
    } else {
        name = str
    }
    const conf = configs.find(isConfigName(name, caseSensitive, checkShort)) ?? name
    return { conf, val }
}

function isConfigName(name: string, caseSensitive: boolean, checkShort = false): (config: ParamConfig) => boolean {
    return config => {
        let { name: confName, shortName, alias } = config
        if (!caseSensitive) {
            confName = confName.toLowerCase()
        }
        if (confName === name) return true
        if (checkShort && shortName === name) return true
        if (alias == null) return false
        if (typeof alias === 'string') return alias === name
        if (Array.isArray(alias)) return alias.includes(name)
        return false
    }
}


function getConfTypeString(conf: ParamConfig) {
    const t = conf.type
    if (t == null) return 'switch'
    if (typeof t === 'string') return t
    if (typeof t === 'function') {
        if (typeof conf.switchValue !== 'undefined') return 'switch or custom'
        return 'custom'
    }
    if (typeof conf.switchValue !== 'undefined') return linguisticJoin([...t, 'switch'])
    return linguisticJoin(t)
}

function linguisticJoin(arr: string[], lastJoiner = ' or', midJoiner = ',') {
    const len = arr.length
    if (len === 0) return ''
    let res = arr[0]
    if (len === 1) return res
    for (let i = 1; i < len - 1; i++) {
        const el = arr[i];
        res += midJoiner + ' '
    }
    return res += lastJoiner + ' ' + arr[len - 1]
}

function convertToNum(val: string) {
    const temp = +val
    if (Number.isSafeInteger(temp)) return temp
    return null
}
function convertToBoolean(val: string, caseSensitive: boolean) {
    const low = caseSensitive ? val : val.toLowerCase()
    if (low === 'false') return false
    if (low === 'true') return true
    return null
}

function validateRawValue(val: string, config: ParamConfig) {
    const { validateRaw, name } = config
    if (validateRaw == null) return val
    if (validateRaw instanceof RegExp) {
        if (validateRaw.test(val)) return val
        throw new Error(`${name}: "${val}" does not match ${validateRaw.toString()}`)
    }
    const validate = validateRaw(val)
    if (validate == null) return val
    if (typeof validate === 'string') throw new Error(name + ': ' + validate)
    if (validate) return val
    throw new Error(`${name}: "${val}" is invalid`)
}

function convertValue(val: string | null, config: ParamConfig, caseSensitive: boolean) {
    const { switchValue, type, name, replace } = config
    if (val == null) {
        if (typeof switchValue === 'undefined') throw new AssignValueError(config)
        return config.switchValue
    }
    if (type == null) throw new AssignValueError(config, val)
    validateRawValue(val, config)
    let res: any
    if (type === 'boolean') res = convertToBoolean(val, caseSensitive)
    else if (type === 'number') res = convertToNum(val)
    else if (type === 'string') res = val
    else if (typeof type === 'function') res = type(val)
    else {
        if (type.includes('boolean')) res = convertToBoolean(val, caseSensitive)
        if (res == null && type.includes('number')) res = convertToNum(val)
        if (res == null && type.includes('string')) res = val
    }
    if (res == null) throw new AssignValueError(config, val)
    if (replace != null) res = replace(res)
    if (config.validate != null) {
        let errMsg: string | undefined
        const validate = config.validate(res)
        if (validate == null) return res
        if (typeof validate === 'string') errMsg = `${name}: ${validate}`
        else if (!validate) errMsg = `${name}: ${(typeof res == 'string' ? `"${res}"` : res)} is Invalid`

        if (errMsg != null) {
            if (config.softValidate) {
                console.warn(errMsg)
                return switchValue
            }
            throw new Error(errMsg)

        }
    }
    return res
}

function assignRaw(obj: IKeyVal<any>, name: string, val: any, multiple: boolean) {
    if (multiple) {
        const temp = obj[name]
        if (temp == null) obj[name] = [val]
        else if (Array.isArray(temp)) {
            temp.push(val)
        } else obj[name] = [temp, val]
    }
    else obj[name] = val
    return
}

function assignGroupRaw(obj: IKeyVal<any>, group: string, name: string, val: any, multiple: boolean) {
    const temp = obj[group]
    if (temp == null) obj = obj[group] = {}
    else obj = temp
    assignRaw(obj, name, val, multiple)
    return
}

function assignValue(obj: IKeyVal<any>, config: ParamConfig, caseSensitive: boolean, value: string | null) {
    const val = convertValue(value, config, caseSensitive)
    const { group, multiple = false } = config
    const name = config.propertyName ?? config.name
    if (group == null) {
        assignRaw(obj, name, val, multiple)
    }
    else if (typeof group == 'string') {
        assignGroupRaw(obj, group, name, val, multiple)
    }
    else for (let i = 0; i < group.length; i++) {
        const el = group[i];
        assignGroupRaw(obj, el, name, val, multiple)
    }
}

function assignNextValue(obj: IKeyVal<any>, configs: ParamConfig[], caseSensitive: boolean, value: string | null) {
    for (let i = 0; i < configs.length; i++) {
        const conf = configs[i];
        const { group, catchAll } = conf
        const name = conf.propertyName ?? conf.name
        if (catchAll === true) {
            assignValue(obj, conf, caseSensitive, value)
            return
        }
        let tempObj = obj
        if (group != null) {
            let temp: string | undefined
            if (typeof group === 'string') temp = group
            else if (group.length > 0) temp = group[0]

            if (temp != null) {
                if (obj[temp] == null) {
                    assignValue(obj, conf, caseSensitive, value)
                    return
                }
                else tempObj = obj[temp]
            }
        }

        if (!(name in tempObj)) {
            assignValue(obj, conf, caseSensitive, value)
            return
        }
    }
    throw new Error('Too many parameters')
}

function addToTree(tree: ITree, config: ParamConfig, index = 0) {
    const val = config.shortName
    if (val == null) return tree
    if (val.length === 0) return tree
    if (val.length === index) {
        tree.val = config
        return tree
    }
    const char = val[index]
    let branch = tree.char[char]
    if (branch == null) {
        branch = tree.char[char] = { char: {} }
    }
    addToTree(branch, config, index + 1)
    return tree
}

function getFromTree(tree: ITree, val: string, index = 0): { config: ParamConfig, index: number } | null {
    if (val.length == 0 || val.length <= index) return null
    const char = val[index]
    const branch = tree.char[char]
    if (branch == null) return null
    if (branch.val != null) return { config: branch.val, index: index + 1 }
    return getFromTree(branch, val, index + 1)
}

function canGetVal({ type }: ParamConfig) {
    return type != null
}
function requiresVal({ switchValue, type }: ParamConfig) {
    return (typeof switchValue === 'undefined') && type != null
}

function assertAndFixConfig(config: ParamConfig, options?: ParamReaderConfig) {
    if (config.name == null || config.name.length === 0) throw new Error('Config needs to have a name')
    if ((typeof config.switchValue === 'undefined') && config.type == null) throw new Error('switchValue or type need to be set on parameter config ' + config.name)
    if (config.catchAll === true) config.multiple = true
    if (options?.caseSensitive !== true) {
        if (config.shortName != null) config.shortName = config.shortName.toLowerCase()
        if (config.alias != null) {
            if (typeof config.alias === 'string') config.alias = config.alias.toLowerCase()
            else if (Array.isArray(config.alias)) config.alias = config.alias.map(a => a.toLowerCase())
        }
    }
    return config
}

export interface ParamReaderConfig {
    /** Will be used instead of `process.argv` */
    source?: string[]
    /** Will be used if `source` or `process.argv` is empty */
    defaultSource?: string[]
    /** Make parameters case sensitive */
    caseSensitive?: boolean
    /** disable dashless mode */
    disableDashlessMode?: boolean
    /** Disable Dashed Mode */
    disableDashedMode?: boolean
}

export type ParamTypes = 'string' | 'number' | 'boolean'

export interface ParamConfig<T = any> {
    /** 
     * Parameter name
     * 
     * Ex: `--port` when `name: 'port'`
     */
    name: string
    /**
     * Different Parameter Name
     */
    alias?: string | string[]
    /**
     * Short Name of parameter
     * 
     * Ex: `-p` when `shortName: 'p'`
     */
    shortName?: string
    /** Property name in returned object */
    propertyName?: string
    /** 
     * Parameter type
     * 
     * Required if `switchValue` is undefined
     */
    type?: ParamTypes | ParamTypes[] | ((val: string) => any)
    /** Replaces value after being converted */
    replace?: (val: any) => T
    /** Validates string before being converted */
    validateRaw?: RegExp | ((val: string) => boolean | string | undefined)
    /** Validates value after being converted */
    validate?: (val: T) => boolean | string | undefined
    /** Invalid values are logged instead of thrown */
    softValidate?: boolean
    /** Property or properties under which to put results */
    group?: string | string[]
    /**
     * Value to set if parameter is not assigned a value
     * 
     * Required if `type` is undefined
     */
    switchValue?: any
    /** 
     * Property can be assigned multiple values
     * 
     * Ex: `{name: 'id', type: 'string', multiple: true}` with args `--id aa --id bb` with return `{id: ['aa', 'bb']}`
     */
    multiple?: boolean
    /**
     * Any values not with property not being specified will be put into this property after all properties specified are assigned a value
     * 
     * Setting this to true will also set `multiple` to true
     */
    catchAll?: boolean
    /** 
     * The value to be set if not set by any arguments
    */
    default?: T
    /**
     * Allow defaults to create group object
     */
    defaultCreateGroup?: boolean
}

interface ParamGroupConfig {
    /**
     * Group Name
     */
    groupName: string
    /**
     * Property name of the group in the returned object
     */
    propertyName?: string
    /**
     * Child Parameter configs of the group
     * 
     * All parameters will have their name prefixed with the group name
     * 
     * Ex: `groupName: 'udp'` and `name: 'port'` will result in `name: 'udp-port'`
     */
    parameters?: (ParamConfig | string)[]
    /**
     * Function that replaces the value of the returned group object
     * 
     * Runs after all arguments have been read and defaults set
     */
    finalize?: (val: any) => any
}