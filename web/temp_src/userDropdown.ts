import { HidableControl } from './control';

export class UserDropdown extends HidableControl {
    constructor(val: string | HTMLDivElement) {
        super(val)
    }
    hide(val = true) {

    }
}