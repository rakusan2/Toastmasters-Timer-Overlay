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
    settings: {
        timerStart?: number
        timerStop?: number
        timerGreen?: number | string
        timerYellow?: number | string
        timerRed?: number | string
        timerOvertime?: number | string
        speakerName?: string
        presetTime?: number | string
        colorOverride?: string
        speakers?: ISpeakerInput[]
        speakerIndex?: number
        speakersHide?: boolean
        [key: string]: any
    }
}
export interface ISpeakerInput {
    id: number
    name?: string
    timeStart?: number
    timeStop?: number
    preset?: string | number
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