import { onSetting } from './settings'
import { fixTimeMap, fixTime } from './util'
import { ITimePreset } from './types'

export const customPreset: ITimePreset = {
    fullName: 'Custom',
    green: '00:05',
    yellow: '00:10',
    red: '00:15',
    overtime: '00:20'
}

export const timePresets = fixTimeMap({
    'TT': {
        fullName: 'Table Topic (1-2min)',
        green: '1:00',
        yellow: '1:30',
        red: '2:00',
        overtime: '3:00'
    },
    'TTFast': {
        fullName: 'Fast Table Topic (0.5-1min)',
        green: '0:30',
        yellow: '0:45',
        red: '1:00',
        overtime: '1:30'
    },
    'IceBr': {
        fullName: 'IceBreaker (4-6Min)',
        green: '4:00',
        yellow: '5:00',
        red: '6:00',
        overtime: '7:00'
    },
    'Speech': {
        fullName: 'Speech (5-7min)',
        green: '5:00',
        yellow: '6:00',
        red: '7:00',
        overtime: '8:00'
    },
    'Eval': {
        fullName: 'Evaluation (2-3min)',
        green: '2:00',
        yellow: '2:30',
        red: '3:00',
        overtime: '4:00'
    },
    '1Min': {
        fullName: '1 Minute',
        green: '0:30',
        yellow: '0:45',
        red: '1:00',
        overtime: '2:00'
    },
    'TOut': {
        fullName: '1Min Timeout',
        green: '1:00',
        yellow: '1:00',
        red: '1:00',
        overtime: '1:00'
    },
    '5TOut': {
        fullName: '5Min Timeout',
        green: '5:00',
        yellow: '5:00',
        red: '5:00',
        overtime: '5:00'
    },
    'Test': {
        fullName: 'Test',
        green: '0:05',
        yellow: '0:10',
        red: '0:15',
        overtime: '0:20'
    }
})

const presetLen = Object.keys(timePresets).length
const presetArr = Object.entries(timePresets)

onSetting('timerGreen', (val) => {
    const time = fixTime(val, null)
    if (time != null) {
        customPreset.green = time
    }
}, timePresets)

onSetting('timerYellow', (val) => {
    const time = fixTime(val, null)
    if (time != null) {
        customPreset.yellow = time
    }
}, timePresets)

onSetting('timerRed', (val) => {
    const time = fixTime(val, null)
    if (time != null) {
        customPreset.red = time
    }
}, timePresets)

onSetting('timerOvertime', (val) => {
    const time = fixTime(val, null)
    if (time != null) {
        customPreset.overtime = time
    }
}, timePresets)

export function getTimeIntervalsEntry(key: string | number, assert: true): {key:string, value: ITimePreset}
export function getTimeIntervalsEntry(key: string | number, assert?: boolean): {key:string, value:ITimePreset} | null
export function getTimeIntervalsEntry(key: string | number, assert = false) {
    if (typeof key === 'string') {
        if (key === 'Custom') {
            return {key, value: customPreset}
        }
        const opt = timePresets[key]
        if (opt != null) return {key, value: opt}
        if (/^\d+$/.test(key)) return getTimeIntervalsEntry(+key, assert)
    } else {
        if (key === presetLen) return {key, value: customPreset}
        if (key >= 0 && key < presetLen && Number.isSafeInteger(key)) {
            return {key, value: presetArr[key]}
        }
    }
    if(assert){
        throw new Error(`Time Interval for ${key} no found`)
    }
    return null
}

export function getTimeIntervals(key: string | number, assert: true): ITimePreset
export function getTimeIntervals(key: string | number, assert?: boolean): ITimePreset | null
export function getTimeIntervals(key: string | number, assert = false) {
    const val = getTimeIntervalsEntry(key, assert)
    if(val == null) return null
    return val.value
}