import { ISettingInputKnown } from './types'

export const HOST = new URL(window.location.href).host

export const defaultSettings: Required<ISettingInputKnown> = {
    timerStart: 0,
    timerStop: 0,
    timerGreen: '00:05',
    timerYellow: '00:10',
    timerRed: '00:15',
    timerOvertime: '00:20',
    speakerName: '',
    presetTime: 'TT',
    speakers: [],
    colorOverride: '',
    speakerIndex: -1,
    speakersHide: true
}