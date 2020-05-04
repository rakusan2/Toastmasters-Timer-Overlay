import { getElementByID, fixTime } from './util'
import { ITimePreset, ISettingKeys } from './types'
import { setSettings } from './settings'

class TimeInput {
    green = getElementByID('GreenTime', 'input')
    yellow = getElementByID('YellowTime', 'input')
    red = getElementByID('RedTime', 'input')
    overtime = getElementByID('OverTime', 'input')

    constructor() {
        this.green.addEventListener('change', setTime('timerGreen'))
        this.yellow.addEventListener('change', setTime('timerYellow'))
        this.red.addEventListener('change', setTime('timerRed'))
        this.overtime.addEventListener('change', setTime('timerOvertime'))

    }

    set(val: ITimePreset) {
        setValue(this.green, val.green)
        setValue(this.yellow, val.yellow)
        setValue(this.red, val.red)
        setValue(this.overtime, val.overtime)
    }
}

function setValue(el: HTMLInputElement, value: string) {
    el.value = value
    if(document.activeElement != null && document.activeElement === el){
        el.setSelectionRange(0, value.length)
    }
}

function setTime(key: ISettingKeys) {
    return function(this: HTMLInputElement) {
        setSettings({ presetTime: 'Custom', [key]: fixTime(this.value) })
    }
}

export default new TimeInput()