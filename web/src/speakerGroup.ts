import { Speaker, createSpeaker } from './speaker'
import { ISpeakerInput } from './types'
import { getElementByID, passStr, passStrNum, passNum } from './util'

export class SpeakerGroup {
    speakers: { [id: number]: Speaker } = {}
    speakerObjects: ISpeakerInput[] = []
    container: HTMLDivElement
    inFocus: Speaker | null = null
    onChange: (val: ISpeakerInput) => any
    onFocus: (id?: number) => any

    constructor(container: string | HTMLDivElement, speakers?: ISpeakerInput[], onFocus: (id?: number) => any = () => { }, onChange?: (val: ISpeakerInput) => any) {
        this.container = typeof container === 'string' ? getElementByID(container, 'div') : container

        this.onChange = val => {
            const speakerObj = this.speakerObjects.find(a => a.id === val.id)
            if (speakerObj == null) {
                console.error('Got Change on non-existent object')
                return
            }
            speakerObj.name = val.name
            speakerObj.preset = val.preset
            speakerObj.timeStart = val.timeStart
            speakerObj.timeStop = val.timeStop
            if (onChange != null) onChange(val)
        }
        this.onFocus = id => {
            if (typeof id === 'number') {
                onFocus(this.getSpeakerPosition(id))
            } else {
                onFocus()
            }
        }

        this.addMany(speakers)
    }

    private _add(speakerArr: ISpeakerInput[], append = true) {
        for (let i = 0; i < speakerArr.length; i++) {
            const speakerObj = speakerArr[i]
            const id = speakerObj.id

            if (typeof this.speakers[id] === 'undefined') {
                const speaker = new Speaker(speakerArr[i], this.onChange)
                this.speakers[id] = speaker
                this.speakerObjects.push(speakerObj)
                speaker.el.onclick = ev => {
                    ev.stopPropagation()
                    this.toggleFocus(id)
                }
                if (append) this.container.append(speaker.el)
            } else {
                console.warn(`Speaker id ${id} already exists`)
            }

        }
    }

    addNew(position = -1) {
        for (let create_try = 0; create_try < 10; create_try++) {
            const newSpeaker = this.addOne(createSpeaker(this.onChange), position)
            if (newSpeaker != null) return newSpeaker
        }
    }

    addOne(speaker: ISpeakerInput, position = -1) {
        const cleaned = cleanSpeaker(speaker)
        if (cleaned == null) return
        const id = cleaned.id

        if (typeof this.speakers[id] === 'undefined') {
            const speaker = new Speaker(cleaned, this.onChange)
            this.speakers[id] = speaker

            speaker.el.onclick = ev => {
                ev.stopPropagation()
                this.toggleFocus(id)
            }

            if (position < 0 || position >= this.speakerObjects.length) {
                this.container.append(speaker.el)
                this.speakerObjects.push(cleaned)
            } else {
                this.container.insertBefore(speaker.el, this.container.children[position])
                this.speakerObjects.splice(position, 0, speaker)
            }
            return speaker
        } else {
            console.warn(`Speaker id ${id} already exists`)
        }
    }

    addMany(speakers?: ISpeakerInput[]) {
        this._add(cleanSpeakerArr(speakers))
    }

    updateOne(val: ISpeakerInput) {
        const cleaned = cleanSpeaker(val)
        if (cleaned == null) throw new Error('Invalid Input')

        const { name, id, preset, timeStart, timeStop } = cleaned

        const speakerObj = this.speakerObjects.find(a => a.id === id)
        const speaker = this.speakers[id]
        if (speakerObj == null || speaker == null) throw new Error('Non-Existent speaker')

        speaker.update(val)

        speakerObj.name = name
        speakerObj.preset = preset
        speakerObj.timeStart = timeStart
        speakerObj.timeStop = timeStop
    }

    updateInFocus(val: Partial<ISpeakerInput>) {
        if (this.inFocus != null) {
            this.updateOne({ ...val, id: this.inFocus.id })
        }
    }

    updateAll(speakers: any) {
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
            if (this.inFocus != null && id.includes(this.inFocus.id)) {
                this.unFocus()
            }
        } else if (typeof this.speakers[id] != 'undefined') {
            if (this.inFocus != null && this.inFocus.id === id) {
                this.unFocus()
            }
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
        if (this.inFocus === speaker) this.unFocus()
        delete this.speakers[speakerObj.id]
    }
    removeAll() {
        this.unFocus()
        this.speakerObjects = []
        this.speakers = {}
        while (this.container.firstChild) {
            const last = this.container.lastChild
            if (last == null) break
            this.container.removeChild(last)
        }
    }

    removeLast() {
        const speakerObj = this.speakerObjects.pop()
        if (speakerObj == null) return

        this.remove(speakerObj.id)
    }

    removeInFocus() {
        if (this.inFocus == null) return
        const id = this.inFocus.id
        this.remove(id)
    }

    focus(id: number) {
        if (typeof this.speakers[id] != 'undefined') {
            const speaker = this.speakers[id]
            if (this.inFocus == speaker) return
            if (this.inFocus != null) {
                this.inFocus.unFocus()
            }
            this.inFocus = speaker
            speaker.focus()
            this.onFocus(id)
        } else {
            this.unFocus()
        }
    }

    toggleFocus(id: number) {
        if (typeof this.speakers[id] != 'undefined') {
            const speaker = this.speakers[id]
            if (this.inFocus == speaker) {
                this.unFocus()
                return
            }
            if (this.inFocus != null) {
                this.inFocus.unFocus()
            }
            this.inFocus = speaker
            speaker.focus()
            this.onFocus(id)
        } else {
            this.unFocus()
        }
    }

    focusAt(position: number) {
        if (position >= 0 && position < this.speakerObjects.length) {
            this.focus(this.speakerObjects[position].id)
        } else {
            this.unFocus()
        }
    }

    focusNext(){
        const inFocus = this.inFocus
        if(inFocus == null) this.focus(this.speakerObjects[0].id)
        else{
            const index = this.speakerObjects.findIndex(a=> a.id === inFocus.id)
            this.focusAt(index + 1)
        }
        return this.inFocus
    }

    unFocus() {
        if (this.inFocus != null) {
            this.inFocus.unFocus()
            this.inFocus = null
            this.onFocus()
        }
    }

    getSpeakerPosition(id: number) {
        return this.speakerObjects.findIndex(a => a.id === id)
    }
}

function cleanSpeaker(obj: any): ISpeakerInput | undefined {
    if (obj != null && typeof obj === 'object' && typeof obj.id === 'number') {
        const { id, name, timeStart, timeStop, preset } = obj as { [P in keyof ISpeakerInput]: any }
        return { id, name: passStr(name), timeStart: passNum(timeStart), timeStop: passNum(timeStop), preset: passStrNum(preset) }
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
                || originalSpeaker.timeStart != secondarySpeaker.timeStart
                || originalSpeaker.timeStop != secondarySpeaker.timeStop

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

interface IDiff {
    change: ISpeakerInput[]
    remove: number[]
    add: ISpeakerInput[]
    move?: number[]
}