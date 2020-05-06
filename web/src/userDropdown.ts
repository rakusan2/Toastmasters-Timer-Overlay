import { HidableControl } from './control';
import { onSetting } from './settings';
import { getElementByID } from './util';
import { SpeakerGroup } from './speaker';

class UserDropdown extends HidableControl {

    buttons = {
        hide: getElementByID('dropdownArrow', 'div'),
        add: getElementByID('dropdown-add', 'div'),
        remove: getElementByID('dropdown-remove', 'div')
    }
    speakers = new SpeakerGroup('dropdown-users')

    isView(val: boolean) {

    }
    hide(val = true) {

    }
    onSpeakers = onSetting('speakers', val => {

    })
    onSpeakerIndex = onSetting('speakerIndex', val => {

    })
}

export default new UserDropdown('dropdown')