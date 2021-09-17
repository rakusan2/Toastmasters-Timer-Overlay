import { IKeyVal } from '../server/src/types'

const presetStr: IPresetString[] = [
    {
        name: 'TT',
        fullName: 'Table Topic (1-2min)',
        green: '01:00',
        yellow: '01:30',
        red: '02:00',
        overtime: '03:00'
    },
    {
        name: 'TTFast',
        fullName: 'Fast Table Topic (0.5-1min)',
        green: '0:30',
        yellow: '0:45',
        red: '01:00',
        overtime: '01:30'
    },
    {
        name: 'IceBr',
        fullName: 'IceBreaker (4-6Min)',
        green: '04:00',
        yellow: '05:00',
        red: '06:00',
        overtime: '07:00'
    },
    {
        name: 'Speech',
        fullName: 'Speech (5-7min)',
        green: '05:00',
        yellow: '06:00',
        red: '07:00',
        overtime: '08:00'
    },
    {
        name: 'Eval',
        fullName: 'Evaluation (2-3min)',
        green: '02:00',
        yellow: '02:30',
        red: '03:00',
        overtime: '04:00'
    },
    {
        name: '1Min',
        fullName: '1 Minute',
        green: '00:30',
        yellow: '00:45',
        red: '01:00',
        overtime: '02:00'
    },
    {
        name: 'TOut',
        fullName: '1Min Timeout',
        green: '01:00',
        yellow: '01:00',
        red: '01:00',
        overtime: '01:00'
    },
    {
        name: '5TOut',
        fullName: '5Min Timeout',
        green: '05:00',
        yellow: '05:00',
        red: '05:00',
        overtime: '05:00'
    },
    {
        name: 'Test',
        fullName: 'Test',
        green: '00:05',
        yellow: '00:10',
        red: '00:15',
        overtime: '00:20'
    }
]


const presetNum = presetStr.map(strToNum)

const nameMap = {} as IKeyVal<{ str: IPresetString, num: IPresetNumber }>

presetStr.forEach((a, i) => nameMap[a.name] = { str: a, num: presetNum[i] })

export function getStrPreset(): IPresetString[]
export function getStrPreset(key: string): IPresetString | null
export function getStrPreset(key?: string) {
    if (key == null) return presetStr
    const temp = nameMap[key]
    if (temp == null) return null
    return temp.str
}

export function getNumPreset(): IPresetNumber[]
export function getNumPreset(key: string): IPresetNumber | null
export function getNumPreset(key?: string) {
    if (key == null) return presetNum
    const temp = nameMap[key]
    if (temp == null) return null
    return temp.num
}

function strToNum(val: IPresetString): IPresetNumber {
    return {
        name: val.name,
        fullName: val.fullName,
        green: timeStrToS(val.green),
        yellow: timeStrToS(val.yellow),
        red: timeStrToS(val.red),
        overtime: timeStrToS(val.overtime),
    }
}

function timeStrToS(val: string) {
    const time = /^(\d+):(\d+)$/.exec(val)
    if (time == null) throw new Error(`"${val}" is not a time string`)
    const [_, h, s] = time
    return ((+h) * 60) + (+s)
}

interface IPresetCommon {
    name: string
    fullName: string
}

export interface IPresetNumber extends IPresetCommon {
    green: number
    yellow: number
    red: number
    overtime: number
}

export interface IPresetString extends IPresetCommon {
    green: string
    yellow: string
    red: string
    overtime: string
}