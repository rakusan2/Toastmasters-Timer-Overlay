import { HidableControl } from './control'
import { checkVersion } from './settings'
import { createElement, getElementByID, getFirstTextByOuterID, getInnerElement } from './util';

class Menu extends HidableControl {
    hideArrow = getElementByID('menu-arrow', 'div')
    hideArrowImg = getInnerElement(this.hideArrow, 'img')
    isShown = false
    oldVersion = 'v0.0.0'

    items = {
        outdated: {
            el: getElementByID('outdateText', 'div'),
            txt: getFirstTextByOuterID('outdateText'),
            refreshButton: getElementByID('refreshOutdated', 'button'),
            removedText: false,
            link: null as null | HTMLAnchorElement
        }
    }
    constructor(val: string | HTMLDivElement) {
        super(val)

        this.hideArrow.onclick = () => this.onHideArrow()
        this.items.outdated.refreshButton.onclick = () => this.onVersionRefresh()

    }

    setVersion(version: string) {
        const div = this.items.outdated
        if (div.removedText) {
            return
        }
        div.txt.nodeValue = version
        div.refreshButton.disabled = false
        this.oldVersion = version
    }

    setNewVersion(newVersion: { version: string, link: string }) {
        const div = this.items.outdated
        if (div.link == null) {
            const link = createElement('a')
            div.txt.remove()
            link.appendChild(div.txt)
            div.el.appendChild(link)
            div.link = link
        }
        div.link.href = newVersion.link
        div.txt.nodeValue = this.oldVersion + ' => ' + newVersion.version
        div.refreshButton.disabled = false

    }

    onVersionRefresh() {
        const div = this.items.outdated
        div.refreshButton.disabled = true
        checkVersion().then(val => {
            if (val == null) return
            console.log('Check Version', val)
            if (val.ok && val.newVersion != null) this.setNewVersion(val.newVersion)
        })
            .catch(console.error)
            .then(() => {
                div.refreshButton.disabled = false
            })
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