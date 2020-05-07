import { TimingSelector } from './timingSelector'

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
export interface IResponseSet {
    keysNotSet: string[]
}
export interface ISettings {
    settings: ISettingInput
}
export type IKeyVal<T> = { [key: string]: T }
export type ISettingSimple = IMayArr<string> | IMayArr<number> | IMayArr<boolean> | undefined
export type ISetting = ISettingSimple | IMayArr<IKeyVal<ISettingSimple>>
export type IFn<T, K = any> = (val: T) => K
export type IBadTimeInput = string | number | null | undefined

export type ISettingInput = ISettingInputKnown | IKeyVal<number | string | undefined | IMayArr<ISpeakerInput>>

export interface ISettingInputKnown {
    timerStart?: number
    timerStop?: number
    timerGreen?: number | string
    timerYellow?: number | string
    timerRed?: number | string
    timerOvertime?: number | string
    speakerName?: string
    presetTime?: number | string
    colorOverride?: string
    speakers?: IMayArr<ISpeakerInput>
    speakerIndex?: number
    speakersHide?: boolean
}

export type ISettingKeys = keyof ISettingInputKnown

export type IMayArr<T> = T | T[]

export type ISettingControl = Required<{
    [P in keyof ISettingInput]: IFn<ISettingInput[P], boolean | undefined>
}>

export interface ITimePreset {
    red: string
    green: string
    yellow: string
    overtime: string
}

export type ITimePresetMs = {
    [P in keyof ITimePreset]: number
}

declare global {
    interface DateConstructor {
        serverNow(): number
    }
}

export interface ISpeakerInput {
    id: number
    name?: string
    time?: string | number
    preset?: string | number
}

export interface ISocketResponse {
    init: IResponse<IResponseInit>
    set: IResponse<IResponseSet>
    get: IResponse<ISettings>
}

export interface ISocketListener {
    connect: []
    changedSetting: [IResponse<ISettings>]
    [key: string]: any[]
}

export type ISettableColours = 'white' | 'green' | 'yellow' | 'red'
export type IMethodDecorator<T> = (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> | void;