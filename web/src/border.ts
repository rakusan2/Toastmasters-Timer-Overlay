import { getElementByID, isSettableColor } from './util'
import { ISettableColours } from './types'
import { setting } from './settings'

class Border {
    private currentColour: ISettableColours = 'white'
    private currentSetColor: ISettableColours = 'white'
    private overrideColour: ISettableColours | '' = ''
    elements: HTMLElement[]

    constructor(elements: (HTMLElement | string)[]) {
        this.elements = elements.map(el => (typeof el === 'string') ? getElementByID(el) : el)
    }

    set colour(val: ISettableColours) {
        this.currentSetColor = val
        this.refresh()
    }
    get colour() {
        return this.currentColour
    }

    refresh() {
        const val = this.overrideColour != '' ? this.overrideColour : this.currentSetColor

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

    @setting('colorOverride')
    onOverride(val: string) {
        if (isSettableColor(val) || val === '') {
            this.overrideColour = val
            this.refresh()
        }
    }
}

export default new Border(['left-border', 'right-border', 'top-border', 'bottom-border'])