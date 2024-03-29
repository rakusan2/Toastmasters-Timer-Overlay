import { TimingSelector } from './timingSelector'
import { getTimeIntervals, getTimeIntervalsEntry } from './timeIntervals'
import { ISpeakerInput } from './types'
import { createElement, fixTime, msToMinSecStr } from './util'
import params from './params'

const isView = typeof params.view != 'undefined'

export class Speaker {
    id: number
    el: HTMLElement
    timeNode: Text
    timeStart: number
    timeStop: number
    nameNode: Text | HTMLInputElement
    nameValue: string
    presetNode: Text | TimingSelector
    presetValue: string
    save
    constructor({ name = '', timeStart = 0, timeStop = 0, preset = 0, id }: ISpeakerInput, onUpdate: (val: ISpeakerInput) => any) {
        this.id = id
        this.timeStart = timeStart
        this.timeStop = timeStop
        const speaker = createElement('div', { className: 'speaker' })
        const speakerTop = createElement('div', { className: 'speaker-top' })
        const speakerTime = createElement('div', { className: 'speaker-time' })
        const speakerName = createElement('div', { className: 'speaker-name' })
        const speakerPreset = createElement('div', { className: 'speaker-preset' })
        const timeText = document.createTextNode(hiddenTimeStr(timeStop, timeStart))
        let nameInput: HTMLInputElement | Text
        let presetInput: TimingSelector | Text

        const doUpdate = () => {
            onUpdate({ id, name: this.nameValue, timeStart: this.timeStart, timeStop: this.timeStop, preset: this.presetValue })
        }

        this.save = doUpdate

        if (isView) {
            nameInput = document.createTextNode(name)
            const { key, value } = getTimeIntervalsEntry(preset, true)
            this.presetValue = key
            presetInput = document.createTextNode(value.fullName)
            speakerPreset.append(presetInput)
        } else {
            nameInput = createElement('input')
            nameInput.value = name
            nameInput.setAttribute('autocorrect', 'off')
            nameInput.setAttribute('spellcheck', 'false')
            presetInput = new TimingSelector(speakerPreset)
            this.presetValue = presetInput.get()
            presetInput.set(preset)
            nameInput.placeholder = "Speaker Name"

            nameInput.addEventListener('change', () => {
                this.nameValue = this.getName()
                doUpdate()
            })

            presetInput.el.addEventListener('change', () => {
                this.presetValue = this.getPreset()
                doUpdate()
            })
        }
        speakerName.append(nameInput)
        speakerTime.append(timeText)
        speakerTop.append(speakerName, speakerTime)
        speaker.append(speakerTop, speakerPreset)
        speaker.setAttribute('data-id', id.toString())

        this.el = speaker
        this.timeNode = timeText
        this.nameNode = nameInput
        this.nameValue = name
        this.presetNode = presetInput
    }

    getTime() {
        return this.timeNode.data
    }

    setStartStop(start:number, stop: number){
        this.timeStart = start
        this.timeStop = stop
        this.timeNode.data = hiddenTimeStr(stop, start)
    }

    setTime(val: string | number | undefined) {
        if (this.timeNode.data !== val) {
            this.timeNode.data = fixTime(val, '')
        }
    }

    getName() {
        if (this.nameNode instanceof Text) {
            return this.nameNode.data
        } else {
            return this.nameNode.value
        }
    }

    setName(val: string = '') {
        if (this.nameNode instanceof Text) {
            this.nameNode.data = val
        } else {
            this.nameNode.value = this.nameValue = val
        }
    }

    getPreset() {
        if (this.presetNode instanceof Text) {
            return this.presetValue
        } else {
            return this.presetNode.get()
        }
    }

    setPreset(val: string | number = 0) {
        if (this.presetValue === val) return
        if (this.presetNode instanceof Text) {
            const { key, value } = getTimeIntervalsEntry(val, true)
            this.presetValue = key
            this.presetNode.data = value.fullName
        } else {
            this.presetNode.set(val)
            this.presetValue = this.presetNode.get()
        }
    }

    update(val: ISpeakerInput) {
        if (this.id !== val.id) return
        this.setTime(hiddenTimeStr(val.timeStop, val.timeStart))
        this.setName(val.name)
        this.setPreset(val.preset)
    }

    focus() {
        this.el.classList.add('inFocus')
    }

    unFocus() {
        this.el.classList.remove('inFocus')
    }
}

export function createSpeaker(onChange: (val: ISpeakerInput) => any) {
    const id = Math.round(Math.random() * 0xffff)
    return new Speaker({ id }, onChange)
}

function hiddenTimeStr(stop = 0, start = 0) {
    if (start > 0 && stop > start) {
        return msToMinSecStr(stop, start)
    } else {
        return ''
    }
}