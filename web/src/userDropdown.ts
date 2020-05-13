import { HidableControl } from './control';
import { Settings } from './settings';
import { getElementByID, getInnerElement } from './util';
import { SpeakerGroup } from './speakerGroup';
import params from './params'

const isView = 'view' in params

class UserDropdown extends HidableControl {
    settings = new Settings()

    buttons = {
        hide: getElementByID('dropdown-arrow', 'div'),
        add: getElementByID('dropdown-add', 'div'),
        remove: getElementByID('dropdown-remove', 'div')
    }
    imgHideArrow = getInnerElement(this.buttons.hide, 'img')
    buttonDiv = getElementByID('dropdown-control', 'div')
    speakers = new SpeakerGroup('dropdown-users', [], id => {
        this.settings.set('speakerIndex', id ?? -1, false)
    }, _val => {
        this.settings.set('speakers', this.speakers.speakerObjects, false)
    })

    usersHidden = true

    constructor(div: string | HTMLElement) {
        super(div)

        this.buttons.add.onclick = () => {
            this.speakers.addNew()
            this.settings.set('speakers', this.speakers.speakerObjects, false)
        }

        this.buttons.remove.onclick = () => {
            if (this.speakers.inFocus != null) {
                this.speakers.removeInFocus()
            } else {
                this.speakers.removeLast()
            }
            this.settings.set('speakers', this.speakers.speakerObjects, false)
        }

        this.buttons.hide.onclick = () => {
            this.settings.set('speakersHide', !this.usersHidden)
            // TODO Put an animation on this
        }
    }

    hideSpeakers(val: boolean) {
        this.settings.set('speakersHide', val)

    }

    hide(val = true) {
        this.buttonDiv.classList.toggle('hide', val)
    }
    show() {
        this.buttonDiv.classList.remove('hide')
    }
    onSpeakers = this.settings.on('speakers', val => {
        this.speakers.updateAll(val)
    })
    onSpeakerIndex = this.settings.on('speakerIndex', val => {
        this.speakers.focusAt(val ?? -1)
    })
    onSpeakerHide = this.settings.on('speakersHide', val => {
        this.usersHidden = val ?? isView
        if(isView){
            this.controlDiv.classList.toggle('hideDrop', this.usersHidden)
        }else{
            this.imgHideArrow.classList.toggle('right', this.usersHidden)
            this.imgHideArrow.classList.toggle('left', !this.usersHidden)
        }
    })
}

export default new UserDropdown('dropdown')