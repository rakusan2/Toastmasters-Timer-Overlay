import { TimingSelector, getOption } from './timingSelector'
import { ISpeakerInput } from './types'
import { createElement, fixTime } from './util'
import params from './params'

const isView = typeof params.view != 'undefined'

export class Speaker {
    id: number
    el: HTMLElement
    timeNode: Text
    nameNode: Text | HTMLInputElement
    nameValue: string
    presetNode: Text | TimingSelector
    presetValue: string
    constructor({ name, time, preset, id }: ISpeakerInput, onUpdate: (val: ISpeakerInput) => any) {
        this.id = id
        const speaker = createElement('div', { className: 'speaker' })
        const speakerTop = createElement('div', { className: 'speaker-top' })
        const speakerTime = createElement('div', { className: 'speaker-time' })
        const speakerName = createElement('div', { className: 'speaker-name' })
        const speakerPreset = createElement('div', { className: 'speaker-preset' })
        const timeText = document.createTextNode(fixTime(time, ''))
        let nameInput: HTMLInputElement | Text
        let presetInput: TimingSelector | Text

        const doUpdate = () => {
            onUpdate({ id, name: this.nameValue, time: this.timeNode.data, preset: this.presetValue })
        }

        if (isView) {
            nameInput = document.createTextNode(name ?? '')
            const opt = getOption(preset ?? 0, true)
            this.presetValue = opt.value
            presetInput = document.createTextNode(opt.text)
            speakerPreset.append(presetInput)
        } else {
            nameInput = createElement('input')
            nameInput.value = name ?? ''
            nameInput.setAttribute('autocorrect', 'off')
            nameInput.setAttribute('spellcheck', 'false')
            presetInput = new TimingSelector(speakerPreset)
            this.presetValue = presetInput.get()
            presetInput.set(preset ?? 0)
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
        this.nameValue = name ?? ''
        this.presetNode = presetInput
    }

    getTime() {
        return this.timeNode.data
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
            const opt = getOption(val, true)
            this.presetValue = opt.value
            this.presetNode.data = opt.text
        } else {
            this.presetNode.set(val)
            this.presetValue = this.presetNode.get()
        }
    }

    update(val: ISpeakerInput) {
        if (this.id !== val.id) return
        this.setTime(val.time)
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