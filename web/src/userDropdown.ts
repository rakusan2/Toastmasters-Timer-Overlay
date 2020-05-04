import { HidableControl } from './control';
import { onSetting } from './settings';
import { getElementByID } from './util';

class UserDropdown extends HidableControl {

    buttons = {
        hide: getElementByID('dropdownArrow', 'div'),
        add: getElementByID('dropdown-add', 'div'),
        remove: getElementByID('dropdown-remove', 'div')
    }
    userBlock = getElementByID('dropdown-users', 'div')

    constructor(val: string | HTMLDivElement) {
        super(val)
    }
    isView(val: boolean) {

    }
    hide(val = true) {

    }
    onSpeakers = onSetting('speakers', val => {

    })
}

export default new UserDropdown('dropdown')