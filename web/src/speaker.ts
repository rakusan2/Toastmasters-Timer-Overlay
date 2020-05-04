import { TimingSelector, getTimingString, getOption } from './timingSelector'
import { ISpeakerInput, ISpeaker } from './types'
import { createElement } from './util'

export default class Speaker {
    el: HTMLElement
    timeNode: Text
    nameNode: Text | HTMLInputElement
    presetNode: Text | TimingSelector
    presetValue: string
    constructor({ name, time, preset }: ISpeakerInput, isView: boolean) {
        const speaker = createElement('div', { className: 'speaker' })
        const speakerTop = createElement('div', { className: 'speaker-top' })
        const speakerTime = createElement('div', { className: 'speaker-time' })
        const speakerName = createElement('div', { className: 'speaker-name' })
        const speakerPreset = createElement('div', { className: 'speaker-preset' })
        const timeText = document.createTextNode(time ?? '')
        let nameInput: ISpeaker['name']
        let presetInput: ISpeaker['preset']

        if (isView) {
            nameInput = document.createTextNode(name ?? '')
            const opt = getOption(preset ?? 0, true)
            this.presetValue = opt.value
            presetInput = document.createTextNode(opt.text)
            speakerPreset.append(presetInput)
        } else {
            nameInput = createElement('input')
            nameInput.value = name ?? ''
            presetInput = new TimingSelector(speakerPreset)
            this.presetValue = presetInput.get()
            presetInput.set(preset ?? 0)
        }
        speakerName.append(nameInput)
        speakerTime.append(timeText)
        speakerTop.append(speakerName, speakerTime)
        speaker.append(speakerTop, speakerPreset)

        this.el = speaker
        this.timeNode = timeText
        this.nameNode = nameInput
        this.presetNode = presetInput
    }

    get time() {
        return this.timeNode.data
    }

    set time(val) {
        this.timeNode.data = val
    }

    get name() {
        if (this.nameNode instanceof Text) {
            return this.nameNode.data
        } else {
            return this.nameNode.value
        }
    }

    set name(val) {
        if (this.nameNode instanceof Text) {
            this.nameNode.data = val
        } else {
            this.nameNode.value = val
        }
    }

    get preset() {
        if (this.presetNode instanceof Text) {
            return this.presetValue
        } else {
            return this.presetNode.get()
        }
    }

    set preset(val) {
        if (this.presetNode instanceof Text) {
            const opt = getOption(val, true)
            this.presetValue = opt.value
            this.presetNode.data = opt.text
        } else {
            this.presetNode.set(val)
            this.presetValue = this.presetNode.get()
        }
    }

}