import { TimingSelector, getOption } from './timingSelector'
import { ISpeakerInput } from './types'
import { createElement, fixTime, passStr, passStrNum, getElementByID } from './util'
import params from './params'

const isView = typeof params.view != 'undefined'

export class Speaker {
    id: number
    el: HTMLElement
    timeNode: Text
    nameNode: Text | HTMLInputElement
    presetNode: Text | TimingSelector
    presetValue: string
    constructor({ name, time, preset, id }: ISpeakerInput) {
        this.id = id
        const speaker = createElement('div', { className: 'speaker' })
        const speakerTop = createElement('div', { className: 'speaker-top' })
        const speakerTime = createElement('div', { className: 'speaker-time' })
        const speakerName = createElement('div', { className: 'speaker-name' })
        const speakerPreset = createElement('div', { className: 'speaker-preset' })
        const timeText = document.createTextNode(fixTime(time, ''))
        let nameInput: HTMLInputElement | Text
        let presetInput: TimingSelector | Text

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
        speaker.setAttribute('data-id', id.toString())

        this.el = speaker
        this.timeNode = timeText
        this.nameNode = nameInput
        this.presetNode = presetInput
    }

    getTime() {
        return this.timeNode.data
    }

    setTime(val: string | number | undefined) {
        if (this.timeNode.data !== val) {
            this.timeNode.data = fixTime(val)
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
            this.nameNode.value = val
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

}

export class SpeakerGroup {
    speakers: { [id: number]: Speaker } = {}
    speakerObjects: ISpeakerInput[] = []
    container: HTMLDivElement

    constructor(container: string | HTMLDivElement, speakers?: ISpeakerInput[]) {
        this.container = typeof container === 'string' ? getElementByID(container, 'div') : container

        this.addMany(speakers)
    }

    private _add(speakerArr: ISpeakerInput[], append = true) {
        for (let i = 0; i < speakerArr.length; i++) {
            const speakerObj = speakerArr[i]
            const id = speakerObj.id

            if (typeof this.speakers[id] === 'undefined') {
                const speaker = new Speaker(speakerArr[i])
                this.speakers[id] = speaker
                this.speakerObjects.push(speakerObj)
                if (append) this.container.append(speaker.el)
            } else {
                console.warn(`Speaker id ${id} already exists`)
            }

        }
    }

    addOne(speaker: ISpeakerInput, position = -1) {
        const cleaned = cleanSpeaker(speaker)
        if (cleaned == null) return
        const id = cleaned.id

        if (typeof this.speakers[id] === 'undefined') {
            const speaker = new Speaker(cleaned)
            this.speakers[id] = speaker

            if (position < 0 || position >= this.speakerObjects.length) {
                this.container.append(speaker.el)
                this.speakerObjects.push(cleaned)
            } else {
                this.container.insertBefore(speaker.el, this.container.children[position])
                this.speakerObjects.splice(position, 0, speaker)
            }
        } else {
            console.warn(`Speaker id ${id} already exists`)
        }
    }

    addMany(speakers?: ISpeakerInput[]) {
        this._add(cleanSpeakerArr(speakers))
    }

    updateAll(speakers: ISpeakerInput[] | ISpeakerInput) {
        const cleaned = cleanSpeakerArr(speakers)
        const { remove, add, move, change } = diffSpeakers(this.speakerObjects, cleaned)

        this.remove(remove)

        if (add.length > 0) {
            this._add(add, move == null)
        }

        if (move != null) {
            this._rearrangeElements(move)
        }

        for (let i = 0; i < change.length; i++) {
            const speaker = change[i]
            const id = speaker.id

            if (typeof this.speakers[id] !== 'undefined') {
                this.speakers[id].update(speaker)
            }
        }
        this.speakerObjects = cleaned
    }

    move(id: number, shift: number) {
        const speakerIndex = this.speakerObjects.findIndex(a => a.id === id)
        if (speakerIndex < 0) throw new Error(`Speaker ${id} not found`)

        this.moveTo(id, Math.max(0, speakerIndex + shift))
    }

    moveTo(id: number, position = -1) {
        if (typeof this.speakers[id] != 'undefined') {
            const speaker = this.speakers[id]
            const speakerObjIndex = this.speakerObjects.findIndex(a => a.id === id)
            if (speakerObjIndex < 0) throw new Error('Speaker exists but its object does not')
            const [speakerObj] = this.speakerObjects.splice(speakerObjIndex, 1)

            if (position < 0 || position >= this.speakerObjects.length) {
                this.container.append(speaker.el)
                this.speakerObjects.push(speakerObj)
            } else {
                this.container.insertBefore(speaker.el, this.container.children[position])
                this.speakerObjects.splice(position, 0, speakerObj)
            }
        }
    }

    rearrange(ids: number[]) {
        this._rearrangeElements(ids)

        const res = this.speakerObjects.filter(a => !ids.includes(a.id))

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i]
            if (typeof this.speakers[id] === 'undefined') continue

            const speaker = this.speakerObjects.find(a => a.id === id)
            if (speaker != null) {
                res.push(speaker)
            }
        }
        this.speakerObjects = res
    }

    private _rearrangeElements(ids: number[]) {
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i]
            if (typeof this.speakers[id] === 'undefined') continue

            this.container.append(this.speakers[id].el)
        }
    }

    remove(id: number | number[]) {
        if (Array.isArray(id)) {
            for (let i = 0; i < id.length; i++) {
                const speakerId = id[i]
                if (typeof this.speakers[speakerId] == 'undefined') continue
                const speaker = this.speakers[speakerId]
                this.container.removeChild(speaker.el)
                delete this.speakers[speakerId]
            }
            this.speakerObjects = this.speakerObjects.filter(a => !id.includes(a.id))
        } else if (typeof this.speakers[id] != 'undefined') {
            this.container.removeChild(this.speakers[id].el)
            delete this.speakers[id]
            this.speakerObjects = this.speakerObjects.filter(a => a.id !== id)
        }
    }
    removeAt(index: number) {
        if (index < 0 || index >= this.speakerObjects.length) return
        const [speakerObj] = this.speakerObjects.splice(index, 1)
        const speaker = this.speakers[speakerObj.id]
        this.container.removeChild(speaker.el)
        delete this.speakers[speakerObj.id]
    }
    removeAll() {
        this.speakerObjects = []
        this.speakers = {}
        while (this.container.firstChild) {
            const last = this.container.lastChild
            if (last == null) break
            this.container.removeChild(last)
        }
    }
}

export function createSpeaker() {
    const id = Math.round(Math.random() * 0xffff)
    return new Speaker({ id })
}
function cleanSpeaker(obj: any): ISpeakerInput | undefined {
    if (obj != null && typeof obj === 'object' && typeof obj.id === 'number') {
        const { id, name, time, preset } = obj
        return { id, name: passStr(name), time: passStrNum(time), preset: passStrNum(preset) }
    }
}
function cleanSpeakerArr(obj: any): ISpeakerInput[] {
    if (obj == null) {
        return []
    } else if (Array.isArray(obj)) {
        const res: ISpeakerInput[] = []
        for (let i = 0; i < obj.length; i++) {
            const cleanObj = cleanSpeaker(obj[i])
            if (cleanObj != null) {
                res.push(cleanObj)
            }
        }
        return res
    } else if (typeof obj == 'object') {
        const cleanObj = cleanSpeaker(obj)
        if (cleanObj == null) {
            return []
        } else {
            return [cleanObj]
        }
    }
    return []
}

function diffSpeakers(original: ISpeakerInput[], secondary: ISpeakerInput[]): IDiff {
    const change: ISpeakerInput[] = [],
        remove: number[] = [],
        add: ISpeakerInput[] = [],
        originalChangedIds: number[] = [],
        originalChangedSpeakers: ISpeakerInput[] = [],
        secondaryIds = secondary.map(a => a.id)

    for (let index = 0; index < original.length; index++) {
        const speaker = original[index]
        const id = speaker.id

        if (!secondaryIds.includes(id)) {
            remove.push(id)
        } else {
            originalChangedIds.push(id)
            originalChangedSpeakers.push(speaker)
        }
    }

    let hasMoved = false

    for (let index = 0; index < secondaryIds.length; index++) {
        const secondarySpeaker = secondary[index]
        const id = secondarySpeaker.id
        const originalIndex = originalChangedIds.indexOf(id)

        if (originalIndex < 0) {
            add.push(secondarySpeaker)
        } else {
            const originalSpeaker = originalChangedSpeakers[originalIndex]
            let addedChange = originalSpeaker.name != secondarySpeaker.name
                || originalSpeaker.preset != secondarySpeaker.preset
                || originalSpeaker.time != secondarySpeaker.time

            if (addedChange) {
                change.push(secondarySpeaker)
            }
        }

        if (originalIndex !== index) {
            hasMoved = true
        }

    }

    const res: IDiff = { change, remove, add }

    if (hasMoved) {
        res.move = secondaryIds
    }

    return res
}

interface IChange {
    id: number
    change: Pick<ISpeakerInput, Exclude<keyof ISpeakerInput, 'id'>>
}

interface IDiff {
    change: ISpeakerInput[]
    remove: number[]
    add: ISpeakerInput[]
    move?: number[]
}