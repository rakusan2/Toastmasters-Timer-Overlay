import { HidableControl } from './control';
import { getElementByID, getFirstTextByOuterID, msToMinSecStr } from './util';
import { onSetting, afterSetting, setSetting, setSettings } from './settings';
import { TimingSelector } from './timingSelector';
import timeInput from './timeInputs'
import border from './border'

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

    constructor(val: string | HTMLDivElement) {
        super(val)

        const { start, reset, next } = this.button

        start.onclick = () => this.onStartButton()
        reset.onclick = () => this.onResetButton()
        next.onclick = () => this.onNextButton()
        this.speaker.onchange = () => this.onSpeakerNameChange()

        this.selector.el.onchange = () => void setSetting('presetTime', this.selector.el.value)
    }

    onStartButton() {
        if (this.timerStart > 0 && this.timerStop == 0) {
            setSetting('timerStop', Date.serverNow())
        } else if (this.timerStart > 0 && this.timerStop > 0) {
            const shift = Date.serverNow() - this.timerStop;
            setSettings({ timerStart: this.timerStart + shift, timerStop: 0 });
        } else {
            setSettings({ timerStart: Date.serverNow(), timerStop: 0 })
        }

        this.updateStartButtonText()
    }

    onResetButton() {
        setSettings({ timerStart: 0, timerStop: 0 })
    }

    onNextButton() {
        // TODO Make Next Button
    }

    onSpeakerNameChange() {
        setSetting('speakerName', this.speaker.value)
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

    updateStartButtonText = afterSetting(['timerStart', 'timerStop'], () => {
        let val = ''

        if (this.timerStart > 0 && this.timerStop == 0) {
            val = 'Stop'
        } else if (this.timerStart > 0 && this.timerStop > 0) {
            val = 'Resume'
        } else {
            val = 'Start'
        }

        if (this.button.start.value != val) {
            this.button.start.value = val
        }
    })

    afterIntervalChange = afterSetting(['timerGreen', 'timerYellow', 'timerRed', 'timerOvertime'], () => {
        this.clearCustomIntervalCache()
        this.refreshTimeInput()
    })

    refresh = afterSetting(['timerStart', 'timerStop', 'presetTime', 'timerGreen', 'timerYellow', 'timerRed', 'timerOvertime'], () => {
        if (this.timerStart === 0) {
            this.readout.data = '00:00'
            border.colour = 'white'
            return
        }
        const { green, yellow, red, overtime } = this.selector.getMsTimeIntervals()
        const msElapsed = (this.timerStop < this.timerStart ? Date.serverNow() : this.timerStop) - this.timerStart

        if (msElapsed < green) {
            border.colour = 'white'
        } else if (msElapsed < yellow) {
            border.colour = 'white'
        } else if (msElapsed < red) {
            border.colour = 'white'
        } else if (msElapsed < overtime) {
            border.colour = 'white'
        } else {
            border.colour = (msElapsed - overtime) % 1000 >= 500 ? 'white' : 'red'
        }

        const timeStr = msToMinSecStr(msElapsed)

        if (timeStr != this.readout.data) {
            this.readout.data = timeStr
        }

        // TODO Do RequestNextFrame
    })

    onStart = onSetting('timerStart', (val) => {
        if (typeof val == 'number') {
            this.timerStart = val
        }
    })

    onStop = onSetting('timerStop', (val) => {
        if (typeof val == 'number') {
            this.timerStop = val
        }
    })


    onPreset = onSetting('presetTime', (val) => {
        if (val != null) {
            this.selector.set(val)
        }
    })


    onSpeakerName = onSetting('speakerName', (val) => {
        if (val != null) {
            this.speaker.value = val
        }
    })
}

export default new ControlBox('controls')