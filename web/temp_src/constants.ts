import { fixTimeMap } from './util'
import { ISettingInput } from './types'

export const HOST = new URL(window.location.href).host

export const timePresets = fixTimeMap({
    'TT': {
        green: '1:00',
        yellow: '1:30',
        red: '2:00',
        overtime: '3:00'
    },
    'IceBr': {
        green: '4:00',
        yellow: '5:00',
        red: '6:00',
        overtime: '7:00'
    },
    'Speech': {
        green: '5:00',
        yellow: '6:00',
        red: '7:00',
        overtime: '8:00'
    },
    'Eval': {
        green: '2:00',
        yellow: '2:30',
        red: '3:00',
        overtime: '4:00'
    },
    '1Min': {
        green: '0:30',
        yellow: '0:45',
        red: '1:00',
        overtime: '2:00'
    },
    'TOut': {
        green: '1:00',
        yellow: '1:00',
        red: '1:00',
        overtime: '1:00'
    },
    'Test': {
        green: '0:05',
        yellow: '0:10',
        red: '0:15',
        overtime: '0:20'
    }
})

export function getTimeIntervals(key: string) {
    if (key in timePresets) {
        return timePresets[key]
    } else {
        return null
    }
}

export const defaultSettings: ISettingInput = Object.freeze({
    timerStart: 0,
    timerStop: 0,
    timerGreen: '00:05',
    timerYellow: '00:10',
    timerRed: '00:15',
    timerOvertime: '00:20',
    speakerName: '',
    presetTime: 'TT'
})