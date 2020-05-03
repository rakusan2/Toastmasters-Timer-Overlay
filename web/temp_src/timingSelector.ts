import { getElementByID, collectionToArray } from './util'
import { getTimeIntervals } from './constants'

const selectorTemplate = getElementByID('timeSelectionTemplate', 'template')
export class TimingSelector {
    selector: HTMLSelectElement
    options: HTMLOptionElement[]
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
        this.selector = getNewSelector()
        this.options = collectionToArray(this.selector.options)
        if (prepend) {
            div.prepend(this.selector)
        } else {
            div.append(this.selector)
        }
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
        if (typeof index === 'undefined') {
            return getTimeIntervals(this.selector.value)
        }

        const value = this.getOptionValue(index)
        if (value != null) {
            return getTimeIntervals(value)
        }

        return null
    }
    set(index: number | string, err = true) {
        const value = this.getOptionValue(index)
        if (value != null) {
            this.selector.value = value
        } else if (err) {
            throw new Error('Invalid input. No option found.')
        }
    }
    get() {
        return this.selector.value
    }
}
export function getNewSelector(option?: string | number) {
    const el = (<DocumentFragment>selectorTemplate.content.cloneNode()).firstElementChild
    if (el == null) {
        throw new Error('Template is Empty')
    }
    if (el.tagName != 'SELECT') {
        throw new Error('Template is missing Selector')
    }
    return el as HTMLSelectElement
}