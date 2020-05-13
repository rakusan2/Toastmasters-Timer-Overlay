import { getElementByID, isSettableColor } from './util'
import { ISettableColours } from './types'
import { onSetting, setSetting } from './settings'
import { onKey, isPressed } from './keyboard'

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

    changeOverride = onKey(['1', '2', '3', 'g', 'y', 'r'], () => {
        const greenKey = isPressed('1') || isPressed('b')
        const yellowKey = isPressed('2') || isPressed('y')
        const redKey = isPressed('3') || isPressed('r')

        if (redKey) {
            setSetting('colorOverride', 'red')
        } else if (yellowKey) {
            setSetting('colorOverride', 'yellow')
        } else if (greenKey) {
            setSetting('colorOverride', 'green')
        } else {
            setSetting('colorOverride', '')
        }
    })

    onOverride = onSetting('colorOverride', (val) => {
        if (isSettableColor(val) || val === '') {
            this.overrideColour = val
            this.refresh()
        }
    }, this)
}

export default new Border(['left-border', 'right-border', 'top-border', 'bottom-border'])