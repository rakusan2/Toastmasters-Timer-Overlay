import { HidableControl } from './control';
import { getElementByID } from './util';
import { HOST } from './constants';

class URIBox extends HidableControl {
    idDiv: HTMLInputElement
    copyButton: HTMLButtonElement

    constructor(val: string | HTMLDivElement) {
        super(val)
        this.idDiv = getElementByID('urlId', 'input')
        this.copyButton = getElementByID('copyLink', 'button')

        this.copyButton.onclick = async () => {
            const perm = await navigator?.permissions?.query?.({ name: 'clipboard-write' } as any)
            if (perm.state === 'granted' || perm.state === 'prompt') {
                navigator.clipboard.writeText(`${HOST}?view&id=${this.idDiv.value}`)
            }
        }
    }
    setID(val: string) {
        this.idDiv.value = val
    }
    lock(val = true) {

    }
}

export default new URIBox('urlControl')