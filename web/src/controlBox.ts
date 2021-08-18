import { HidableControl } from './control';
import { getElementByID, getFirstTextByOuterID, msToMinSecStr, requestNextFrame } from './util';
import { onSetting, afterSetting, setSetting, setSettings } from './settings';
import { TimingSelector } from './timingSelector';
import timeInput from './timeInputs'
import border from './border'
import { onKeyDown } from './keyboard';
import { ISpeakerInput } from './types';

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
    private speakers:ISpeakerInput[] = []

    tempStorage?: Omit<ISpeakerInput,'id'> | null
    speakerIndex = -1

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

        if(this.speakerIndex >= 0){
            const speaker = this.speakers[this.speakerIndex]
            speaker.timeStart = this.timerStart
            speaker.timeStop = this.timerStop
            setSetting('speakers', this.speakers)
        }
        else setSettings({ timerStart: this.timerStart, timerStop: this.timerStop })
    }

    onResetButton() {
        this.timerStart = 0
        this.timerStop = 0

        if(this.speakerIndex >= 0){
            const speaker = this.speakers[this.speakerIndex]
            speaker.timeStart = 0
            speaker.timeStop = 0
            setSetting('speakers', this.speakers)
        }
        setSettings({ timerStart: 0, timerStop: 0 })
    }

    onNextButton() {
        const index = this.speakerIndex
        if(index >= 0){
            if(index + 1 < this.speakers.length){
                setSetting('speakerIndex', this.speakerIndex + 1)
            }else{
                setSetting('speakerIndex', -1)
            }
        } else{
            this.speakers.push({
                id: genID(this.speakers),
                name: this.speaker.value,
                preset: this.selector.get(),
                timeStart: this.timerStart,
                timeStop: this.timerStop
            })
            this.tempStorage = null
            this.selector.set(0)
            this.speaker.value = ''
            this.timerStart = this.timerStop = 0
            setSetting('speakers', this.speakers)
        }
    }

    onSpeakerNameChange() {
        const speakerName = this.speaker.value
        if(this.speakerIndex >= 0){
            this.speakers[this.speakerIndex].name = speakerName
            setSetting('speakers', this.speakers)
        }
        else setSetting('speakerName', this.speaker.value)
    }

    onSelectorChange(){
        const preset = this.selector.el.value
        if(this.speakerIndex >= 0){
            this.speakers[this.speakerIndex].preset = preset
            setSetting('speakers', this.speakers)
        }else{
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
            if(this.tempStorage != null){
                this.tempStorage.timeStart = val
            }
            else this.timerStart = val
        }
    }, this)

    onStop = onSetting('timerStop', (val) => {
        if (typeof val == 'number') {
            if(this.tempStorage != null){
                this.tempStorage.timeStop = val
            }
            else this.timerStop = val
        }
    }, this)


    onPreset = onSetting('presetTime', (val) => {
        if (val != null) {
            if(this.tempStorage != null){
                this.tempStorage.preset = val
            }
            else this.selector.set(val)
        }
    }, this)


    onSpeakerName = onSetting('speakerName', (val) => {
        if (val != null) {
            if(this.tempStorage != null){
                this.tempStorage.name = val
            }
            else this.speaker.value = val
        }
    }, this)

    onSpeakerIndexChange = onSetting('speakerIndex', val => {
        if(val != null){
            if(this.speakerIndex < 0 && val >= 0){
                this.tempStorage = {
                    preset: this.selector.get(),
                    name: this.speaker.value,
                    timeStart: this.timerStart,
                    timeStop: this.timerStop
                }
            }
            else if(val < 0 && this.tempStorage != null){
                this.setSpeaker(this.tempStorage)
                this.tempStorage = null
            }
            if(val >= 0 && this.speakers.length > val){
                this.setSpeaker(this.speakers[val])
            }
        }
        console.log({val, pre: this.speakerIndex, len: this.speakers.length})
        this.speakerIndex = val ?? -1
    }, this)
    setSpeaker({name = '', preset = 0, timeStart = 0, timeStop = 0}: Omit<ISpeakerInput,'id'>){
        this.speaker.value = name
        this.selector.set(preset) 
        this.timerStart = timeStart
        this.timerStop = timeStop
    }
    onSpeakerChange = onSetting('speakers', val =>{
        if(val == null) return
        this.speakers = val
        if(this.speakerIndex >= 0){
            if(val.length <= this.speakerIndex){
                this.speakerIndex = -1
            }else{
                this.setSpeaker(val[this.speakerIndex])
            }
        }
    }, this)
}

function genID(idObj:{id:number}[]){
    for (let i = 0; i < 10; i++) {
        const id = Math.round(Math.random() * 0xffff)
        if(!idObj.some(a=> a.id === id)) return id
    }
    throw new Error('Unable to create id')
}

export default new ControlBox('controls')