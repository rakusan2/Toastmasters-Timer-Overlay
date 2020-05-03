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
    settings: ISettingInput
}
export type IKeyVal<T> = { [key: string]: T }
export type ISetting = string | number | boolean
export type IFn<T, K = any> = (val: T) => K
export type IBadTimeInput = string | number | null | undefined

export interface ISettingInput {
    timerStart?: number
    timerStop?: number
    timerGreen?: number | string
    timerYellow?: number | string
    timerRed?: number | string
    timerOvertime?: number | string
    speakerName?: string
    presetTime?: number | string
    colorOverride?: string
    addSpeaker?: IMayArr<{ name?: string, time?: string | number, preset?: number | string }>
    [key: string]: any
}

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

declare global{
    interface DateConstructor {
        serverNow(): number
}
}

export interface ISpeaker {
    speakerDiv: HTMLDivElement
    name: Text
    time: Text
    preset: Text | HTMLSelectElement
}

export type ISettableColours = 'white' | 'green' | 'yellow' | 'red'