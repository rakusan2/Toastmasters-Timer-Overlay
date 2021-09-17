import { HidableControl } from './control';
import { getElementByID, getFirstTextByOuterID, msToMinSecStr, requestNextFrame } from './util';
import { onSetting, afterSetting, setSetting, setSettings } from './settings';
import { TimingSelector } from './timingSelector';
import timeInput from './timeInputs'
import border from './border'
import { onKeyDown } from './keyboard';
import { ISpeakerInput } from './types';
import userDropdown from './userDropdown'
import { Speaker } from './speaker';

const speakers = userDropdown.speakers

class ControlBox extends HidableControl {
    timerStart = 0
    timerStop = 0

    button = {
        start: getElementByID('timerStart', 'button'),
        reset: getElementByID('timerReset', 'button'),
        next: getElementByID('timerNext', 'button')
    }
    selector = new TimingSelector('controlHead', true)
    speaker = getElementByID('SpeakerName', 'input')
    readout = getFirstTextByOuterID('timeReadout')

    tempStorage?: Omit<ISpeakerInput, 'id'> | null

    constructor(val: string | HTMLDivElement) {
        super(val)

        const { start, reset, next } = this.button

        start.onclick = () => this.onStartButton()
        reset.onclick = () => this.onResetButton()
        next.onclick = () => this.onNextButton()
        this.speaker.onchange = () => this.onSpeakerNameChange()

        this.selector.el.onchange = () => this.onSelectorChange()
    }

    onStartButton() {
        if (this.timerStart > 0 && this.timerStop == 0) {
            this.timerStop = Date.now()
        } else if (this.timerStart > 0 && this.timerStop > 0) {
            const shift = Date.now() - this.timerStop;
            this.timerStart = this.timerStart + shift
            this.timerStop = 0
        } else {
            this.timerStart = Date.now(), this.timerStop = 0
        }

        const inFocus = speakers.inFocus
        if (inFocus != null) {
            inFocus.setStartStop(this.timerStart, this.timerStop)
            inFocus.save()
        }
        else setSettings({ timerStart: this.timerStart, timerStop: this.timerStop })
    }

    onResetButton() {
        this.timerStart = 0
        this.timerStop = 0

        const inFocus = speakers.inFocus
        if (inFocus != null) {
            inFocus.setStartStop(0, 0)
            inFocus.save()
        }
        setSettings({ timerStart: 0, timerStop: 0 })
    }

    onNextButton() {
        const inFocus = speakers.inFocus
        if (inFocus == null) {
            const speaker = speakers.addNew()
            if (speaker != null) {
                speaker.setName(this.speaker.value)
                speaker.setPreset(this.selector.el.value)
                speaker.setStartStop(this.timerStart, this.timerStop)
                speaker.save()
            }
            setSettings({ speakerName: '', presetTime: 0, timerStart: 0, timerStop: 0 })
        }
        else speakers.focusNext()
    }

    onSpeakerNameChange() {
        const inFocus = speakers.inFocus
        const name = this.speaker.value
        if (inFocus == null) setSetting('speakerName', name)
        else {
            inFocus.setName(name)
            inFocus.save()
        }
    }

    onSelectorChange() {
        const preset = this.selector.el.value
        const inFocus = speakers.inFocus
        if (inFocus != null) {
            inFocus.setPreset(preset)
            inFocus.save()
        } else {
            setSetting('presetTime', preset)
        }
    }

    clearCustomIntervalCache() {
        if (this.selector.isCustom()) {
            this.selector.clearCache()
        }
    }

    refreshTimeInput() {
        const intervals = this.selector.getTimeIntervals()
        if (intervals != null) {
            timeInput.set(intervals)
        }
    }

    onStartKey = onKeyDown('k', () => {
        this.onStartButton()
    })

    onEscKey = onKeyDown('esc', () => {
        this.onResetButton()
    })

    updateStartButtonText = afterSetting(['timerStart', 'timerStop', 'speakers', 'speakerIndex'], () => {
        const text = this.button.start.firstChild as Text
        let val = ''

        if (this.timerStart > 0 && this.timerStop == 0) {
            val = 'Stop'
        } else if (this.timerStart > 0 && this.timerStop > 0) {
            val = 'Resume'
        } else {
            val = 'Start'
        }

        if (text.data != val) {
            text.data = val
        }
    }, this)

    afterIntervalChange = afterSetting(['timerGreen', 'timerYellow', 'timerRed', 'timerOvertime', 'presetTime'], () => {
        this.clearCustomIntervalCache()
        this.refreshTimeInput()
    }, this)

    refresh = afterSetting(['timerStart', 'timerStop', 'presetTime', 'timerGreen', 'timerYellow', 'timerRed', 'timerOvertime', 'speakers', 'speakerIndex'], async () => {
        if (this.timerStart === 0) {
            this.readout.data = '00:00'
            border.colour = 'white'
            return
        }
        const { green, yellow, red, overtime } = this.selector.getMsTimeIntervals()
        const msElapsed = (this.timerStop < this.timerStart ? Date.now() : this.timerStop) - this.timerStart

        if (msElapsed < green) {
            border.colour = 'white'
        } else if (msElapsed < yellow) {
            border.colour = 'green'
        } else if (msElapsed < red) {
            border.colour = 'yellow'
        } else if (msElapsed < overtime) {
            border.colour = 'red'
        } else {
            border.colour = (msElapsed - overtime) % 1000 >= 500 ? 'white' : 'red'
        }

        const timeStr = msToMinSecStr(msElapsed)

        if (timeStr != this.readout.data) {
            this.readout.data = timeStr
        }

        if (this.timerStart > 0 && this.timerStop == 0) {
            await requestNextFrame()
            this.refresh()
        }
    }, this)

    onStart = onSetting('timerStart', (val) => {
        if (typeof val == 'number') {
            if (this.tempStorage != null) {
                this.tempStorage.timeStart = val
            }
            else this.timerStart = val
        }
    }, this)

    onStop = onSetting('timerStop', (val) => {
        if (typeof val == 'number') {
            if (this.tempStorage != null) {
                this.tempStorage.timeStop = val
            }
            else this.timerStop = val
        }
    }, this)


    onPreset = onSetting('presetTime', (val) => {
        if (val != null) {
            if (this.tempStorage != null) {
                this.tempStorage.preset = val
            }
            else this.selector.set(val)
        }
    }, this)


    onSpeakerName = onSetting('speakerName', (val) => {
        if (val != null) {
            if (this.tempStorage != null) {
                this.tempStorage.name = val
            }
            else this.speaker.value = val
        }
    }, this)

    onSpeakerIndexChange = afterSetting('speakerIndex', () => {
        const inFocus = speakers.inFocus
        const storage = this.tempStorage
        console.log({ inFocus: inFocus?.id, storage })
        if (inFocus == null) {
            if (storage == null) return
            this.setSpeaker(storage)
            this.tempStorage = null
        } else if (storage == null) {
            this.tempStorage = {
                preset: this.selector.get(),
                name: this.speaker.value,
                timeStart: this.timerStart,
                timeStop: this.timerStop
            }
            this.setSpeaker(inFocus)
        } else {
            this.setSpeaker(inFocus)
        }
    }, this)
    setSpeaker(val: Speaker | Omit<ISpeakerInput, 'id'>) {
        if (val instanceof Speaker) {
            this.speaker.value = val.nameValue
            this.selector.set(val.presetValue)
            this.timerStart = val.timeStart
            this.timerStop = val.timeStop
        } else {
            const { name = '', preset = 0, timeStart = 0, timeStop = 0 } = val
            this.speaker.value = name
            this.selector.set(preset)
            this.timerStart = timeStart
            this.timerStop = timeStop
        }
        this.refreshTimeInput()
    }
    onSpeakerChange = afterSetting('speakers', () => {
        if (this.tempStorage == null) return
        this.onSpeakerIndexChange()
    }, this)
}

function genID(idObj: { id: number }[]) {
    for (let i = 0; i < 10; i++) {
        const id = Math.round(Math.random() * 0xffff)
        if (!idObj.some(a => a.id === id)) return id
    }
    throw new Error('Unable to create id')
}

export default new ControlBox('controls')