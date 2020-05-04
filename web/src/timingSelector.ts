import { getElementByID, collectionToArray, timePresetStringToMs } from './util'
import { getTimeIntervals } from './timeIntervals'
import { ITimePresetMs, ITimePreset } from './types'

const selectorTemplate = getElementByID('timeSelectionTemplate', 'template')
export class TimingSelector {
    el: HTMLSelectElement
    options: HTMLOptionElement[]
    intervalCache: { str?: ITimePreset, ms?: ITimePresetMs } = {}

    constructor(appendTo: HTMLElement | string, prepend = false) {
        let div: HTMLElement | null
        if (typeof appendTo === 'string') {
            div = getElementByID(appendTo)
        } else {
            div = appendTo
        }
        if (div == null || typeof div != 'object') {
            throw new Error('Invalid Element')
        }
        this.el = getNewSelector()
        this.options = collectionToArray(this.el.options)
        if (prepend) {
            div.prepend(this.el)
        } else {
            div.append(this.el)
        }
    }

    onCustomChange() {

    }

    getOption(index: number | string): null | HTMLOptionElement {
        if (typeof index === 'number') {
            if (Number.isNaN(index)) {
                return null
            }
            if (index < this.options.length) {
                return this.options[index]
            }
        } else {
            const opt = this.options.find(el => el.value == index)
            if (opt != null) {
                return opt
            }
            if (/^\d+$/.test(index)) {
                return this.getOption(+index)
            }
        }
        return null
    }

    getOptionValue(index: number | string) {
        const opt = this.getOption(index)
        return opt?.value
    }

    getOptionText(index: number | string) {
        const opt = this.getOption(index)
        return opt?.text
    }

    getTimeIntervals(index?: number | string) {
        if (typeof this.intervalCache.str != 'undefined') {
            return this.intervalCache.str
        }

        const value = index == null ? this.el.value : this.getOptionValue(index)

        if (value != null) {
            const intervals = getTimeIntervals(value)
            if (intervals != null) {
                this.intervalCache.str = intervals
            }
            return intervals
        }

        return null
    }

    getMsTimeIntervals(assert: true): ITimePresetMs
    getMsTimeIntervals(assert: false): ITimePresetMs | null
    getMsTimeIntervals(index?: number | string, assert?: true): ITimePresetMs
    getMsTimeIntervals(index: number | string, assert: false): ITimePresetMs | null
    getMsTimeIntervals(index?: number | string | boolean, assert = true): ITimePresetMs | null {
        if (typeof this.intervalCache.ms != 'undefined') {
            return this.intervalCache.ms
        }

        if (typeof index == 'boolean') {
            assert = index
            index = undefined
        }

        const intervals = this.getTimeIntervals(index)

        if (intervals == null) {
            if (assert) {
                throw new Error('No Intervals could be extracted from the selector')
            }
            return null
        }

        return timePresetStringToMs(intervals)
    }

    isCustom() {
        return this.el.value === 'Custom'
    }

    clearCache() {
        this.intervalCache = {}
    }

    set(index: number | string, err = true) {
        if (this.el.value === index) return
        const value = this.getOptionValue(index)
        if (value != null) {
            this.el.value = value
        } else if (err) {
            throw new Error('Invalid input. No option found.')
        }

        this.intervalCache = {}
    }

    get() {
        return this.el.value
    }
}
export function getNewSelector() {
    const fragment = selectorTemplate.content.cloneNode(true) as DocumentFragment
    const el = fragment.firstElementChild
    
    if (el == null) {
        throw new Error('Template is Empty')
    }
    if (el.tagName != 'SELECT') {
        throw new Error('Template is missing Selector')
    }
    return el as HTMLSelectElement
}