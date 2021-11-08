import { HidableControl } from './control';
import { onKeyDown } from './keyboard';
import { onSetting } from './settings'
import { getElementByID, getFirstTextByOuterID, getInnerElement } from './util';

class Menu extends HidableControl {
    hideArrow = getElementByID('menu-arrow', 'div')
    hideArrowImg = getInnerElement(this.hideArrow, 'img')
    isShown = false

    items = {
        outdated: {
            txt: getFirstTextByOuterID('outdateText'),
            refresh: getElementByID('refreshOutdated')
        }
    }
    constructor(val: string | HTMLDivElement) {
        super(val)

        this.hideArrow.onclick = () => this.onHideArrow()

    }

    setVersion(version: string) {
        this.items.outdated.txt.nodeValue = version
    }

    onHideArrow() {
        const isShown = this.isShown = !this.isShown
        this.controlDiv.classList.toggle('showMenu', isShown)

        this.hideArrowImg.className = isShown ? 'left' : 'right'
    }

    // addControls(val: IControl[]) {

    // }
}

// type IControl = IControlInput | IControlButton | IControlSlider

// interface IControlCommon<T> {
//     text: string
//     defaultValue: T
//     func?: (val: T) => any
// }

// interface IControlInput extends IControlCommon<string> {
//     type: 'input'
// }

// interface IControlButton extends IControlCommon<string> {
//     type: 'button'
// }

// interface IControlSlider extends IControlCommon<string> {
//     type: 'slider'
//     min?: number
//     max?: number
// }

export default new Menu('menu-container')