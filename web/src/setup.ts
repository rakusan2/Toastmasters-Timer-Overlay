const selectorTemplate = document.getElementById('timeSelections') as HTMLTemplateElement
const controlHead = document.getElementById('controlHead') as HTMLDivElement
const controlBox = document.getElementById('controls') as HTMLDivElement
const urlControlBox = document.getElementById('urlControl') as HTMLDivElement
const dropdownControl = document.getElementById('dropdown-control') as HTMLDivElement
const dropdownArrow = document.getElementById('dropdown-arrow') as HTMLDivElement
const dropdownAdd = document.getElementById('dropdown-add') as HTMLDivElement
const dropdownUsers = document.getElementById('dropdown-users') as HTMLDivElement
const selector = (<DocumentFragment>selectorTemplate.content.cloneNode(true)).firstElementChild as HTMLSelectElement
const urlId = document.getElementById('urlId') as HTMLInputElement
const speakerName = document.getElementById('SpeakerName') as HTMLInputElement
const readout = document.getElementById('timeReadout')?.firstChild as Text
const timeControl = {
    green: document.getElementById('GreenTime') as HTMLInputElement,
    yellow: document.getElementById('YellowTime') as HTMLInputElement,
    red: document.getElementById('RedTime') as HTMLInputElement,
    overtime: document.getElementById('OverTime') as HTMLInputElement,
    timerStart: 0,
    timerStop: 0,
    custom: {
        green: '00:05',
        yellow: '00:10',
        red: '00:15',
        overtime: '00:20'
    }
}
let lastSelection = 'tt'

const buttons = {
    startButton: document.getElementById('timerStart') as HTMLButtonElement,
    stopButton: document.getElementById('timerStop') as HTMLButtonElement,
    resetButton: document.getElementById('timerReset') as HTMLButtonElement,
    linkCopyButton: document.getElementById('copyLink') as HTMLButtonElement
}
const borderDivCollection = {
    left: document.getElementById('left') as HTMLDivElement,
    right: document.getElementById('right') as HTMLDivElement,
    top: document.getElementById('top') as HTMLDivElement,
    bottom: document.getElementById('bottom') as HTMLDivElement,
}

const params = getParams()
const isView = typeof params.view !== 'undefined'
let pageID = params?.id

function stopKeyPropagation(el: HTMLElement) {
    el.onkeydown = ev => ev.stopPropagation()
    el.onkeyup = ev => ev.stopPropagation()
}

function getParams() {
    const params: { [key: string]: string | null } = {}
    document.URL.split('?').slice(1).forEach(query => {
        query.split('&').forEach(part => {
            const [key, val] = part.split('=').map(a => a.trim())
            if (key.length > 0) {
                params[key] = (val == null ? null : val)
            }
        })
    })
    return params
}

stopKeyPropagation(urlId)
stopKeyPropagation(speakerName)
stopKeyPropagation(timeControl.green)
stopKeyPropagation(timeControl.yellow)
stopKeyPropagation(timeControl.red)
stopKeyPropagation(timeControl.overtime)