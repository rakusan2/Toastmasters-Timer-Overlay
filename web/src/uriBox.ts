import { HidableControl } from './control';
import { getElementByID, getInnerText, clipboardCopy } from './util';
import { HOST } from './constants';

class URIBox extends HidableControl {
    idDiv = getElementByID('urlId', 'input')
    copyButton = getElementByID('copyLink', 'button')

    constructor(val: string | HTMLDivElement) {
        super(val)

        const urlText = getInnerText(this.controlDiv)
        urlText.data = `${location.host}?view&id=`

        this.copyButton.onclick = async () => {
            await clipboardCopy(`${HOST}?view&id=${this.idDiv.value}`)
        }
    }
    setID(val: string) {
        this.idDiv.value = val
    }
    lock(val = true) {

    }
}

export default new URIBox('urlControl')