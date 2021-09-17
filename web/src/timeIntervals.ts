import { onSetting } from './settings'
import { fixTime } from './util'
import { ITimePreset } from './types'
import { getStrPreset } from '../../common/presets'

export const customPreset: ITimePreset = {
    fullName: 'Custom',
    green: '00:05',
    yellow: '00:10',
    red: '00:15',
    overtime: '00:20'
}

export const timePresets = getStrPreset()

const presetLen = timePresets.length

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

export function getTimeIntervalsEntry(key: string | number, assert: true): { key: string, value: ITimePreset }
export function getTimeIntervalsEntry(key: string | number, assert?: boolean): { key: string, value: ITimePreset } | null
export function getTimeIntervalsEntry(key: string | number, assert = false) {
    if (typeof key === 'string') {
        if (key === 'Custom') {
            return { key, value: customPreset }
        }
        const opt = timePresets.find(a=>a.name === key)
        if (opt != null) return { key, value: opt }
        if (/^\d+$/.test(key)) return getTimeIntervalsEntry(+key, assert)
    } else {
        if (key === presetLen) return { key, value: customPreset }
        if (key >= 0 && key < presetLen && Number.isSafeInteger(key)) {
            return { key, value: timePresets[key] }
        }
    }
    if (assert) {
        throw new Error(`Time Interval for ${key} no found`)
    }
    return null
}

export function getTimeIntervals(key: string | number, assert: true): ITimePreset
export function getTimeIntervals(key: string | number, assert?: boolean): ITimePreset | null
export function getTimeIntervals(key: string | number, assert = false) {
    const val = getTimeIntervalsEntry(key, assert)
    if (val == null) return null
    return val.value
}