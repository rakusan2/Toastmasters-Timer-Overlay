import { HidableControl } from './control';
import { getElementByID } from './util';

class ControlBox extends HidableControl {
    button: {
        start: HTMLButtonElement,
        reset: HTMLButtonElement,
        next: HTMLButtonElement
    }
    constructor(val: string | HTMLDivElement) {
        super(val)

        this.button = {
            start: getElementByID('timerStart', 'button'),
            reset: getElementByID('timerReset', 'button'),
            next: getElementByID('timerNext', 'button')
        }
    }
}

export const controlBox = new ControlBox('controls')