import { getElementByID } from './util'

export class HidableControl {
    controlDiv: HTMLElement
    constructor(el: HTMLElement | string) {
        if (typeof el === 'string') {
            this.controlDiv = getElementByID(el)
        } else {
            this.controlDiv = el
        }
    }
    hide(val = true) {
        this.controlDiv.classList.toggle('hide', val)
    }
    show() {
        this.hide(false)
    }
}