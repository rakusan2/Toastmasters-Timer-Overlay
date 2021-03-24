import { HidableControl } from './control';
import { getElementByID, getInnerText, clipboardCopy } from './util';
import { HOST } from './constants';

class URIBox extends HidableControl {
    idDiv = getElementByID('urlId', 'input')
    copyButton = getElementByID('copyLink', 'button')

    constructor(val: string | HTMLDivElement) {
        super(val)

        const urlText = getInnerText(this.controlDiv)
        urlText.data = `http://${location.host}?view&id=`

        this.copyButton.onclick = () => {
            clipboardCopy(`http://${HOST}?view&id=${this.idDiv.value}`).catch(err => {
                console.error({ failedCopy: err })
            })
        }
    }
    setID(val: string) {
        this.idDiv.value = val
    }
    lock(val = true) {
        this.idDiv.disabled = val
    }
}

export default new URIBox('urlControl')
