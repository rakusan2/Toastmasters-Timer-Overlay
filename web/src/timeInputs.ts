import { getElementByID } from './util'
import { ITimePreset } from './types'

class TimeInput {
    green = getElementByID('GreenTime', 'input')
    yellow = getElementByID('YellowTime', 'input')
    red = getElementByID('RedTime', 'input')
    overtime = getElementByID('OverTime', 'input')

    constructor() {

    }

    set(val: ITimePreset) {
        this.green.value = val.green
        this.yellow.value = val.yellow
        this.red.value = val.red
        this.overtime.value = val.overtime
    }
}
export default new TimeInput()