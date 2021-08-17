import {CommandLineOptions} from 'command-line-args'
export type IResponseFn<T = {}> = (res: IResponse<T>) => any

export type IResponse<T = {}> = IResponseERR | (IResponseOK & T)

export interface IUser extends ISettings {
    lastMessageAt: number
}
export interface IResponseERR {
    ok: false
    err: string
}
export interface IResponseOK {
    ok: true
}
export interface IResponseInit extends ISettings {
    id: string
    idLock: boolean
    serverTime: number
}
export interface ISettings {
    settings: IKeyVal<ISetting>
}
export type IKeyVal<T> = { [key: string]: T }
export type IKeyNVal<T> = { [key: number]: T }
export type IFun<T = any> = (val: T) => any
export type ISetting = string | number | boolean

export interface IParamOptions {
    bool?: boolean
    num?: boolean
    str?: boolean | 'lower' | 'upper'
    requireVal?: boolean
    keyword?: string
    alias?: string | string[]
    callback: IFun
}

export interface IOptions extends CommandLineOptions {
    server: {
        port: number,
        cache: string | boolean,
        'one-id'?: string,
        open?: string
    }
    obs: {
        obs?: string | boolean,
        profile?: string
        scene?: string
        minimize?: boolean
    }
}