const socket = io()
const controlBox = document.getElementById('controls') as HTMLDivElement
const urlControlBox = document.getElementById('urlControl') as HTMLDivElement
const selector = document.getElementById('timeSelection') as HTMLSelectElement
const urlId = document.getElementById('urlId') as HTMLInputElement
const speakerName = document.getElementById('SpeakerName') as HTMLInputElement
const readout = document.getElementById('timeReadout')?.firstChild as Text
const timeControl = {
    green: document.getElementById('GreenTime') as HTMLInputElement,
    yellow: document.getElementById('YellowTime') as HTMLInputElement,
    red: document.getElementById('RedTime') as HTMLInputElement,
    overtime: document.getElementById('OverTime') as HTMLInputElement,
    timerStart: 0,
    timerStop: 0
}
let lastSelection = 'tt'

const buttons = {
    startButton: document.getElementById('timerStart') as HTMLButtonElement,
    stopButton: document.getElementById('timerStop') as HTMLButtonElement,
    resetButton: document.getElementById('timerReset') as HTMLButtonElement,
    linkCopyButton: document.getElementById('copyLink') as HTMLButtonElement
}
const border = {
    left: document.getElementById('left') as HTMLDivElement,
    right: document.getElementById('right') as HTMLDivElement,
    top: document.getElementById('top') as HTMLDivElement,
    bottom: document.getElementById('bottom') as HTMLDivElement,
}
const NUM_OF_SPEECH_PRESETS = 7
const timeFormat = /(\d{1,2}):(\d{1,2})/

const params = getParams()
const isView = typeof params.view === 'string'
let id = params?.view || params?.id

let idSet = false

let intervalTimer = -1

controlBox.classList.toggle('hide', isView)
urlControlBox.classList.toggle('hide', isView)

function selectPreselect(val: any) {
    if (typeof val === 'number' && val > 0 && val < NUM_OF_SPEECH_PRESETS) {
        selector.value = (<HTMLOptionElement>selector.item(val)).value
        changeTimes()
        return true
    } else if (typeof val === 'string') {
        const el = (<HTMLOptionElement[]>[...selector.options as any]).find(a => a.value == val)
        if (el != null) {
            selector.value = el.value
            changeTimes()
            return true
        }
    }
}

function timeCalc() {
    if (timeControl.timerStart === 0) {
        setBorder('white')
    }

    const { timerStart, timerStop } = timeControl
    const green = minSecToMS(timeControl.green.value)
    const yellow = minSecToMS(timeControl.yellow.value)
    const red = minSecToMS(timeControl.red.value)
    const overtime = minSecToMS(timeControl.overtime.value)

    const msElapsed = (timerStop < timerStart ? Date.now() : timerStop) - timerStart

    if (msElapsed < green) {
        setBorder('white')
    } else if (msElapsed < yellow) {
        setBorder('green')
    } else if (msElapsed < red) {
        setBorder('yellow')
    } else if (msElapsed < overtime) {
        setBorder('red')
    } else {
        setBorder((msElapsed - overtime) % 1000 < 500 ? 'red' : 'white')
    }

    const secElapsed = msElapsed / 1000

    const sec = secElapsed % 60
    const min = (secElapsed - sec) / 60

    readout.data = `${digitNumber(min,2)}:${digitNumber(sec,2)}`

    if (intervalTimer === -1 && timerStart > 0 && timerStop === 0) {
        intervalTimer = window.setInterval(() => window.requestAnimationFrame(() => timeCalc()))
        console.log('Set Timer')
    } else if (intervalTimer != -1 && (timerStart === 0 || (timerStop > 0 && Date.now() > timerStop))) {
        clearInterval(intervalTimer)
        intervalTimer = -1
        console.log('Cleared Timer')
    }

}

function digitNumber(num:number, count:number){
    return num.toFixed(0).padStart(count,'0')
}

function setBorder(colour: 'red' | 'yellow' | 'green' | 'white') {
    if (colour === 'white') {
        setBorderClass('border')
    }
    setBorderClass(`border ${colour}-bg`)
}

function setBorderClass(name: string) {
    border.top.className = name
    border.bottom.className = name
    border.left.className = name
    border.right.className = name
}

function minSecToMS(val: string) {
    let m = val.match(timeFormat)
    if (m == null) {
        return 0
    } else {
        let [, min, sec] = m
        return ((+min * 60) + +sec) * 1000
    }
}

const setFns: IKeyVal<(val: ISetting) => boolean | undefined> = {
    timerStart(val) {
        if (typeof val === 'number') {
            timeControl.timerStart = val
            return true
        }
    },
    timerStop(val) {
        if (typeof val === 'number') {
            timeControl.timerStop = val
            return true
        }
    },
    timerGreen(val) {
        if (typeof val === 'number') {
            const sec = val % 60
            const min = ((val - sec) / 60) % 60
            timeControl.green.value = `${min}:${sec}`
            return true
        } else if (typeof val === 'string' && timeFormat.test(val)) {
            timeControl.green.value = val
            return true
        }
    },
    timerYellow(val) {
        if (typeof val === 'number') {
            const sec = val % 60
            const min = ((val - sec) / 60) % 60
            timeControl.yellow.value = `${min}:${sec}`
            return true
        } else if (typeof val === 'string' && timeFormat.test(val)) {
            timeControl.yellow.value = val
            return true
        }
    },
    timerRed(val) {
        if (typeof val === 'number') {
            const sec = val % 60
            const min = ((val - sec) / 60) % 60
            timeControl.red.value = `${min}:${sec}`
            return true
        } else if (typeof val === 'string' && timeFormat.test(val)) {
            timeControl.red.value = val
            return true
        }
    },
    timerOvertime(val) {
        if (typeof val === 'number') {
            const sec = val % 60
            const min = ((val - sec) / 60) % 60
            timeControl.overtime.value = `${min}:${sec}`
            return true
        } else if (typeof val === 'string' && timeFormat.test(val)) {
            timeControl.overtime.value = val
            return true
        }
    },
    speakerName(val) {
        if (typeof val === 'string') {
            speakerName.value = val
            return true
        }
    },
    presetTime(val) {
        return selectPreselect(val)
    }
}



function getParams() {
    const params: { [key: string]: string } = {}
    document.URL.split('?').slice(1).forEach(a => {
        const [key, val] = a.split('=').map(a => a.trim())
        params[key] = val
    })
    return params
}

console.log({ params, isView })


buttons.linkCopyButton.onclick = function () {
    navigator?.permissions?.query?.({ name: 'clipboard-write' } as any)
        .then(res => {
            if (res.state === 'granted' || res.state === 'prompt') {
                navigator.clipboard.writeText(`localhost:8888?view=${id}`)
                urlId.classList.toggle('bg-green', true)
                setTimeout(() => urlId.classList.toggle('green-bg', false), 500)
            }
        })
}

selector.onchange = changeTimes
function changeTimes() {
    const { green, yellow, red, overtime } = timeControl
    const val = selector.value
    let changed = true
    switch (val) {
        case 'tt':
            green.value = '1:00'
            yellow.value = '1:30'
            red.value = '2:00'
            overtime.value = '3:00'
            break
        case 'ib':
            green.value = '4:00'
            yellow.value = '5:00'
            red.value = '6:00'
            overtime.value = '7:00'
            break
        case 's':
            green.value = '5:00'
            yellow.value = '6:00'
            red.value = '7:00'
            overtime.value = '8:00'
            break
        case 'e':
            green.value = '2:00'
            yellow.value = '2:30'
            red.value = '3:00'
            overtime.value = '4:00'
            break
        case '1':
            green.value = '0:30'
            yellow.value = '0:45'
            red.value = '1:00'
            overtime.value = '2:00'
            break
        case 'TOut':
            green.value = '1:00'
            yellow.value = '1:00'
            red.value = '1:00'
            overtime.value = '1:30'
            break
        case 'test':
            green.value = '0:05'
            yellow.value = '0:10'
            red.value = '0:15'
            overtime.value = '0:20'
            break
        default:
            selector.value = lastSelection
            changed = false
    }
    if (changed) {
        if (lastSelection != val) {
            sendSettings({ presetTime: val })
        }
        lastSelection = val
    }
}

buttons.startButton.onclick = function () {
    setSetting('timerStart', Date.now(), true)
    timeCalc()
}
buttons.stopButton.onclick = function () {
    setSetting('timerStop', Date.now(), true)
    timeCalc()
}
buttons.resetButton.onclick = function () {
    const settings = { timerStart: 0, timerStop: 0 }
    setSettings(settings)
    sendSettings(settings)
}

socket.on('connect', () => {
    socket.emit('init', id, (res: IResponse<IResponseInit>) => {
        console.log({ init: res })
        if (res.ok) {
            id = res.id.toString(16)
            urlId.value = id
            idSet = true
            if (typeof params['view'] == 'undefined') {
                history.replaceState({ id }, document.title, `?id=${id}`)
            }
        } else {
            console.error({ from: 'init', err: res.err })
        }
    })
})
socket.on('changedSetting', (res: IResponse<ISettings>) => {
    console.log({ changedSetting: res })
    if (res.ok) {
        setSettings(res.settings)
    } else {
        console.error({ from: 'changedSetting', err: res.err })
    }
})

function setSettings(settings: IKeyVal<ISetting>) {
    for (let key in settings) {
        setSetting(key, settings[key], false)
    }
    timeCalc()
}

function setSetting(key: string, val: ISetting, send = true) {
    if (typeof setFns[key] == 'function') {
        if (setFns[key](val)) {
            console.log({ set: { key, val } })
            if (send) {
                sendSettings({ [key]: val })
            }
        } else {
            console.error(`Invalid ${key} value. Got ${val}`)
        }
    } else {
        console.log({ unknown: key })
    }
}

function sendSettings(settings: IKeyVal<ISetting>) {
    if (idSet && socket.connected) {
        socket.emit('set', settings, (res: IResponse<{ keysNotSet: string[] }>) => {
            if (res.ok && res.keysNotSet.length > 0) {
                console.warn({ keysNotSet: res.keysNotSet })
            }
        })
    }
}

type IResponseFn<T = {}> = (res: IResponse<T>) => any

type IResponse<T = {}> = IResponseERR | (IResponseOK & T)

interface IUser extends ISettings {
    lastMessageAt: number
}
interface IResponseERR {
    ok: false
    err: string
}
interface IResponseOK {
    ok: true
}
interface IResponseInit extends ISettings {
    id: number
}
interface ISettings {
    settings: IKeyVal<ISetting>
}
type IKeyVal<T> = { [key: string]: T }
type ISetting = string | number | boolean
