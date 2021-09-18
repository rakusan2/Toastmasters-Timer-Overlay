import { isStringArray } from './tools'
import { IKeyVal } from './types'

/**
 * Turns process.argv to an object
 */
export function getParams(configPar: (ParamConfig | string)[]): IKeyVal<any>
export function getParams(defaultPar: string[], configPar: (ParamConfig | string)[]): IKeyVal<any>
export function getParams(defaultPar: string[] | (ParamConfig | string)[], configPar?: (ParamConfig | string)[]) {
    let args = process.argv.splice(2)
    if (configPar == null) {
        configPar = defaultPar
    }
    else if (args.length === 0 && isStringArray(defaultPar)) {
        args = defaultPar
    }
    const config = replaceStringConfig(configPar)
    const shortTree = config.reduce((tree, val) => addToTree(tree, val), { char: {} } as ITree)
    const res: IKeyVal<any> = {}
    const hasDash = args.some(a => a[0] === '-')

    for (let i = 0; i < args.length; i++) {
        let arg = args[i];
        if (arg.length === 0) continue
        if (arg[0] === '-') {
            if (arg.length === 1) continue
            if (arg[1] === '-') {
                if (arg.length === 2) continue
                arg = arg.slice(2)
                const { conf, val } = getConfVal(config, arg)
                if (typeof conf === 'string') throw new Error('Unknown parameter ' + conf)
                if (canGetVal(conf)) {
                    if (val != null) {
                        assignValue(res, conf, val)
                        continue
                    }
                    let nextArg = args.length === i + 1 ? void 0 : args[i + 1]
                    if (nextArg == null || nextArg[0] === '-') {
                        if (requiresVal(conf)) throw new MissingValueError(conf)
                        nextArg = void 0
                    } else i++
                    assignValue(res, conf, nextArg)
                } else if (val != null) {
                    throw new AssignValueError(conf, val)
                }
                else {
                    assignValue(res, conf)
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
                    assignValue(res, conf)
                }
                if (arg[index] === '=') {
                    assignValue(res, lastConf, arg.slice(index + 1))
                }
                else if (canGetVal(lastConf)) {
                    let nextArg
                    if (i + 1 < args.length) nextArg = args[i + 1]
                    if (nextArg == null || nextArg[0] === '-') nextArg = void 0
                    else i++
                    assignValue(res, lastConf, nextArg)
                } else assignValue(res, lastConf)
            }
            continue
        }
        if (hasDash) {
            assignNextValue(res, config, arg)
        } else {
            const { conf, val } = getConfVal(config, arg, true)
            if (typeof conf === 'string') {
                if (val != null) throw new Error('Unknown parameter ' + conf)
                assignNextValue(res, config, arg)
            } else if (val == null && conf.switchValue == null) {
                assignNextValue(res, config, arg)
            } else {
                assignValue(res, conf, val)
            }
        }
    }
    return res
}

function replaceStringConfig(config: (ParamConfig | string)[]): ParamConfig[] {
    const res = new Array<ParamConfig>(config.length)
    for (let i = 0; i < config.length; i++) {
        const el = config[i];
        if (typeof el === 'string') res[i] = { name: el, type: 'string' }
        else res[i] = assertConfig(el)
    }
    return res
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

function getConfVal(configs: ParamConfig[], str: string, checkShort?: boolean) {
    let match: null | RegExpExecArray = null
    let name: string, val: string | undefined
    if (str.includes('=') && (match = /^([^=]*)=(.*)$/.exec(str)) != null) {
        name = match[1]
        val = match[2]
    } else {
        name = str
    }
    const conf = configs.find(isConfigName(name, checkShort)) ?? name
    return { conf, val }
}

function isConfigName(name: string, checkShort = false): (config: ParamConfig) => boolean {
    return config => {
        if (config.name === name) return true
        if (checkShort && config.shortName === name) return true
        if (config.alias == null) return false
        if (typeof config.alias === 'string') return config.alias === name
        if (Array.isArray(config.alias)) return config.alias.includes(name)
        return false
    }
}


function getConfTypeString(conf: ParamConfig) {
    const t = conf.type
    if (t == null) return 'switch'
    if (typeof t === 'string') return t
    if (typeof t === 'function') {
        if (conf.switchValue != null) return 'switch or custom'
        return 'custom'
    }
    if (conf.switchValue != null) return linguisticJoin([...t, 'switch'])
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
function convertToBoolean(val: string) {
    const low = val.toLowerCase()
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

function convertValue(val: string | undefined, config: ParamConfig) {
    const { switchValue, type, name, replace } = config
    if (val == null) {
        if (switchValue == null) throw new AssignValueError(config)
        return config.switchValue
    }
    if (type == null) throw new AssignValueError(config, val)
    validateRawValue(val, config)
    let res: any
    if (type === 'boolean') res = convertToBoolean(val)
    else if (type === 'number') res = convertToNum(val)
    else if (type === 'string') res = val
    else if (typeof type === 'function') res = type(val)
    else {
        if (type.includes('boolean')) res = convertToBoolean(val)
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

function assignValue(obj: IKeyVal<any>, config: ParamConfig, value?: string) {
    const val = convertValue(value, config)
    const { group, multiple = false } = config
    const name = config.parameterName ?? config.name
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

function assignNextValue(obj: IKeyVal<any>, configs: ParamConfig[], value?: string) {
    for (let i = 0; i < configs.length; i++) {
        const conf = configs[i];
        const { group, catchAll } = conf
        const name = conf.parameterName ?? conf.name
        if (catchAll === true) {
            assignValue(obj, conf, value)
            return
        }
        let tempObj = obj
        if (group != null) {
            let temp: string | undefined
            if (typeof group === 'string') temp = group
            else if (group.length > 0) temp = group[0]

            if (temp != null) {
                if (obj[temp] == null) {
                    assignValue(obj, conf, value)
                    return
                }
                else tempObj = obj[temp]
            }
        }

        if (!(name in tempObj)) {
            assignValue(obj, conf, value)
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
    return switchValue == null && type != null
}

function assertConfig(config: ParamConfig) {
    if (config.name == null || config.name.length === 0) throw new Error('Config needs to have a name')
    if (config.switchValue == null && config.type == null) throw new Error('switchValue or type need to be set on parameter config ' + config.name)
    if (config.catchAll === true) config.multiple = true
    return config
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
    /** Parameter name in returned object */
    parameterName?: string
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
}