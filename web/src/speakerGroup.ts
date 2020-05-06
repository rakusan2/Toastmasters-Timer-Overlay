import { Speaker } from './speaker'
import { ISpeakerInput } from './types'
import { getElementByID, passStr, passStrNum } from './util'

export class SpeakerGroup {
    speakers: { [id: number]: Speaker } = {}
    speakerObjects: ISpeakerInput[] = []
    container: HTMLDivElement
    inFocus: Speaker | null = null

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

    focus(id: number) {
        if (typeof this.speakers[id] != 'undefined') {
            const speaker = this.speakers[id]
            if(this.inFocus == speaker)return
            if(this.inFocus != null){
                this.inFocus.unFocus()
            }
            this.inFocus = speaker
            speaker.focus()
        }else{
            this.unFocus()
        }
    }

    focusAt(position: number) {
        if(position>0 && position < this.speakerObjects.length){
            this.focus(this.speakerObjects[position].id)
        }else{
            this.unFocus()
        }
    }

    unFocus(){
        this.inFocus?.unFocus()
        this.inFocus = null
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

interface IDiff {
    change: ISpeakerInput[]
    remove: number[]
    add: ISpeakerInput[]
    move?: number[]
}