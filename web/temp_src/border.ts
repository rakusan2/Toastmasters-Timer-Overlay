import { getElementByID } from './util'
import { ISettableColours } from './types'

export class Border {
    private currentColour: ISettableColours = 'white'
    elements: HTMLElement[]
    constructor(elements: (HTMLElement | string)[]) {
        this.elements = elements.map(el => (typeof el === 'string') ? getElementByID(el) : el)
    }

    set colour(val: ISettableColours) {
        if (this.currentColour == val) {
            return
        }
        let className = 'border'
        if (val != 'white') {
            className += ` ${val}-bg`
        }
        this.elements.forEach(el => el.className = className)
        this.currentColour = val
    }
    get colour() {
        return this.currentColour
    }
}