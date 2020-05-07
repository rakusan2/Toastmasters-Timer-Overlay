import { HidableControl } from './control';
import { onSetting, setSetting, setSettings } from './settings';
import { getElementByID } from './util';
import { SpeakerGroup } from './speakerGroup';
import params from './params'

class UserDropdown extends HidableControl {

    buttons = {
        hide: getElementByID('dropdown-arrow', 'div'),
        add: getElementByID('dropdown-add', 'div'),
        remove: getElementByID('dropdown-remove', 'div')
    }
    buttonDiv = getElementByID('dropdown-control', 'div')
    speakers = new SpeakerGroup('dropdown-users', [], id => {
        setSetting('speakerIndex', id ?? -1, true, true, this)
    }, _val => {
        setSetting('speakers', this.speakers.speakerObjects, true, true, this)
    })

    usersHidden = 'view' in params

    constructor(div: string | HTMLElement) {
        super(div)

        this.buttons.add.onclick = () => {
            this.speakers.addNew()
            setSettings({ speakers: this.speakers.speakerObjects }, true, true, this)
        }

        this.buttons.remove.onclick = () => {
            if (this.speakers.inFocus != null) {
                this.speakers.removeInFocus()
            } else {
                this.speakers.removeLast()
            }
            setSettings({ speakers: this.speakers.speakerObjects }, true, true, this)
        }

        this.buttons.hide.onclick = () => {
            setSetting('speakersHide', !this.usersHidden)
        }
    }

    hideSpeakers(val = this.usersHidden) {
        this.usersHidden = val

    }

    hide(val = true) {
        this.buttonDiv.classList.toggle('hide', val)
    }
    onSpeakers = onSetting('speakers', val => {
        this.speakers.updateAll(val)
    }, this)
    onSpeakerIndex = onSetting('speakerIndex', val => {
        this.speakers.focusAt(val ?? -1)
    }, this)
    onSpeakerHide = onSetting('speakersHide', val => {
        this.usersHidden = val ?? 'view' in params
    }, this)
}

export default new UserDropdown('dropdown')