import { onSetting } from './settings'
import { fixTimeMap, fixTime } from './util'
import { ITimePreset } from './types'

export const customPreset: ITimePreset = {
    green: '00:05',
    yellow: '00:10',
    red: '00:15',
    overtime: '00:20'
}

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

onSetting('timerGreen', (val) => {
    const time = fixTime(val, null)
    if (time != null) {
        customPreset.green = time
    }
})

onSetting('timerYellow', (val) => {
    const time = fixTime(val, null)
    if (time != null) {
        customPreset.yellow = time
    }
})

onSetting('timerRed', (val) => {
    const time = fixTime(val, null)
    if (time != null) {
        customPreset.red = time
    }
})

onSetting('timerOvertime', (val) => {
    const time = fixTime(val, null)
    if (time != null) {
        customPreset.overtime = time
    }
})

export function getTimeIntervals(key: string) {
    if (key === 'Custom') {
        return customPreset
    }
    if (key in timePresets) {
        return timePresets[key]
    } else {
        return null
    }
}