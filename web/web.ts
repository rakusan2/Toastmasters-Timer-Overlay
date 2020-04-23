const HOST = 'localhost:8888'
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
const border = {
    left: document.getElementById('left') as HTMLDivElement,
    right: document.getElementById('right') as HTMLDivElement,
    top: document.getElementById('top') as HTMLDivElement,
    bottom: document.getElementById('bottom') as HTMLDivElement,
}
const timeFormat = /(\d{1,2}):(\d{1,2})/

const params = getParams()
const isView = typeof params.view !== 'undefined'
let id = params?.id

let idSet = false
let colourOverride: 'red' | 'yellow' | 'green' | '' = ''

const timePresets = fixTimes({
    'TT': {
        green: '1:00',
        yellow: '1:30',
        red: '2:00',
        overtime: '3:00'
    },
    'IceBr': {
        green: '4:00',
        yellow: '5:00',
        red: '6:00',
        overtime: '7:00'
    },
    'Speech': {
        green: '5:00',
        yellow: '6:00',
        red: '7:00',
        overtime: '8:00'
    },
    'Eval': {
        green: '2:00',
        yellow: '2:30',
        red: '3:00',
        overtime: '4:00'
    },
    '1Min': {
        green: '0:30',
        yellow: '0:45',
        red: '1:00',
        overtime: '2:00'
    },
    'TOut': {
        green: '1:00',
        yellow: '1:00',
        red: '1:00',
        overtime: '1:00'
    },
    'Test': {
        green: '0:05',
        yellow: '0:10',
        red: '0:15',
        overtime: '0:20'
    }
})

const defaultSettings: ISettingInput = {
    timerStart: 0,
    timerStop: 0,
    timerGreen: '00:05',
    timerYellow: '00:10',
    timerRed: '00:15',
    timerOvertime: '00:20',
    speakerName: '',
    presetTime: 'TT'
}

let serverTimeOffset = 0
Date.serverNow = function() {
    return Date.now() - serverTimeOffset
}

controlBox.classList.toggle('hide', isView)
urlControlBox.classList.toggle('hide', isView)

function selectPreselect(val: any) {
    if (typeof val === 'number' && val > 0 && val < selector.options.length) {
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
        readout.data = '00:00'
        setBorder('white')
        return
    }

    const { timerStart, timerStop } = timeControl
    const green = minSecToMS(timeControl.green.value)
    const yellow = minSecToMS(timeControl.yellow.value)
    const red = minSecToMS(timeControl.red.value)
    const overtime = minSecToMS(timeControl.overtime.value)

    const msElapsed = (timerStop < timerStart ? Date.serverNow() : timerStop) - timerStart

    if (msElapsed < green) {
        setBorder('white')
    } else if (msElapsed < yellow) {
        setBorder('green')
    } else if (msElapsed < red) {
        setBorder('yellow')
    } else if (msElapsed < overtime) {
        setBorder('red')
    } else {
        setBorder((msElapsed - overtime) % 1000 >= 500 ? 'white' : 'red')
    }

    const secElapsed = Math.floor(msElapsed / 1000)

    const sec = secElapsed % 60
    const min = Math.floor(secElapsed / 60)
    const timeStr = `${digitNumber(min, 2)}:${digitNumber(sec, 2)}`

    if (timeStr != readout.data) {
        readout.data = timeStr
    }

    if (timerStart > 0 && timerStop === 0) {
        requestNextFrame()
    }

}

function onKeyChange(changedKey: string, keys: IKeyVal<boolean>, isRepeat: boolean) {
    if (!isRepeat) {
        if (keys['R'] || keys['3']) {
            setSetting('colorOverride', 'red', true)
        } else if (keys['Y'] || keys['2']) {
            setSetting('colorOverride', 'yellow', true)
        } else if (keys['G'] || keys['1']) {
            setSetting('colorOverride', 'green', true)
        } else {
            setSetting('colorOverride', '', true)
        }
        timeCalc()

        if (keys['K']) {
            if (timeControl.timerStart > 0) {
                if (timeControl.timerStop > 0) {
                    resumeTime()
                } else {
                    pauseTime()
                }
            } else {
                startTime()
            }
        }
    }
    return false
}

let reDrawInProgress = false
function requestNextFrame() {
    if (!reDrawInProgress) {
        reDrawInProgress = true
        window.requestAnimationFrame(() => {
            reDrawInProgress = false
            timeCalc()
        })
    }
}

function digitNumber(num: number, count: number) {
    return num.toFixed(0).padStart(count, '0')
}

function setBorder(colour: 'red' | 'yellow' | 'green' | 'white' = 'white') {
    if (colourOverride != '') {
        colour = colourOverride
    }
    if (colour === 'white') {
        setBorderClass('border')
    } else {
        setBorderClass(`border ${colour}-bg`)
    }
}

function setBorderClass(name: string) {
    const lastName = border.top.className.trim()
    const newName = name.trim()

    if (lastName === newName) return

    border.top.className = newName
    border.bottom.className = newName
    border.left.className = newName
    border.right.className = newName
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

function setStartButtonText() {
    const textNode = buttons.startButton.firstChild as Text
    if (timeControl.timerStart > 0 && timeControl.timerStop > 0) {
        textNode.data = 'Resume'
    } else {
        textNode.data = 'Start'
    }
}

const setFns: ISettingControl = {
    timerStart(val) {
        if (typeof val === 'number') {
            timeControl.timerStart = val
            setStartButtonText()
            return true
        }
    },
    timerStop(val) {
        if (typeof val === 'number') {
            timeControl.timerStop = val
            setStartButtonText()
            return true
        }
    },
    timerGreen(val) {
        const time = fixTime(val, null)
        if (time != null) {
            timeControl.custom.green = time
            return true
        }
    },
    timerYellow(val) {
        const time = fixTime(val, null)
        if (time != null) {
            timeControl.custom.yellow = time
            return true
        }
    },
    timerRed(val) {
        const time = fixTime(val, null)
        if (time != null) {
            timeControl.custom.red = time
            return true
        }
    },
    timerOvertime(val) {
        const time = fixTime(val, null)
        if (time != null) {
            timeControl.custom.overtime = time
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
    },
    colorOverride(val) {
        if (val === 'green' || val === 'yellow' || val === 'red' || val === '') {
            colourOverride = val
            return true
        }
        return false
    }
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

console.log({ params, isView })


buttons.linkCopyButton.onclick = function() {
    navigator?.permissions?.query?.({ name: 'clipboard-write' } as any)
        .then(res => {
            if (res.state === 'granted' || res.state === 'prompt') {
                navigator.clipboard.writeText(`${HOST}?view&id=${id}`)
                urlId.classList.toggle('green-bg', true)
                setTimeout(() => urlId.classList.toggle('green-bg', false), 500)
            }
        })
}

function fixTimes(presets: IKeyVal<{ [P in keyof ITimePreset]: IBadTimeInput }>): IKeyVal<ITimePreset> {
    const res: IKeyVal<ITimePreset> = {}
    for (let key in presets) {
        const { green, yellow, red, overtime } = presets[key]
        res[key] = {
            green: fixTime(green),
            yellow: fixTime(yellow),
            red: fixTime(red),
            overtime: fixTime(overtime),
        }
    }
    return res
}

function fixTime(time: IBadTimeInput): string
function fixTime<T>(time: IBadTimeInput, defaultVal: T): string | T
function fixTime(time: IBadTimeInput, defaultVal: any = '00:00') {
    const ex = extractTime(time)
    if (ex == null) {
        return defaultVal
    } else {
        return `${ex.min}:${ex.s}`
    }
}
function extractTime(time: IBadTimeInput) {
    if (time == null) return null
    const m = (typeof time === 'string' ? time.match(timeFormat) : null)
    if (m == null) {
        let t = +time
        if (Number.isNaN(t) || t < 0) {
            return null
        } else {
            const sec = t % 60
            const min = (t - sec) / 60
            return { s: sec.toFixed(0).padStart(2, '0'), min: min.toFixed(0).padStart(2, '0') }
        }
    } else {
        return { s: m[2].padStart(2, '0'), min: m[1].padStart(2, '0') }
    }
}
selector.onchange = () => {
    if (changeTimes()) {
        sendSettings({ presetTime: selector.value })
    }
    timeCalc()
}
function changeTimes() {
    const val = selector.value
    if (val === 'Custom') {
        setTimeSections(timeControl.custom)
    } else if (typeof timePresets[val] == 'object') {
        setTimeSections(timePresets[val])
    } else {
        return false
    }
    return true
}

function setTimeSections(sectTimes: ITimePreset) {
    const { green, yellow, red, overtime } = timeControl
    green.value = sectTimes.green
    yellow.value = sectTimes.yellow
    red.value = sectTimes.red
    overtime.value = sectTimes.overtime
}

timeControl.green.onchange = function() {
    const val = fixTime(timeControl.green.value)
    setSettings({ timerGreen: val, presetTime: 'Custom' }, true)
}
timeControl.red.onchange = function() {
    const val = fixTime(timeControl.red.value)
    setSettings({ timerRed: val, presetTime: 'Custom' }, true)
}

timeControl.yellow.onchange = function() {
    const val = fixTime(timeControl.yellow.value)
    setSettings({ timerYellow: val, presetTime: 'Custom' }, true)
}

timeControl.overtime.onchange = function() {
    const val = fixTime(timeControl.overtime.value)
    setSettings({ timerOvertime: val, presetTime: 'Custom' }, true)
}

urlId.onchange = function() {
    const val = urlId.value.trim()
    if (/^[0-9a-zA-Z-_]{1,4}$/.test(val)) {
        init(val)
    } else {
        urlId.value = id ?? ''
    }
}

speakerName.onchange = function() {
    const val = speakerName.value.trim()
    sendSettings({ speakerName: val })
}


function startTime() {
    setSettings({ timerStart: Date.serverNow(), timerStop: 0 }, true)
}
function pauseTime() {
    setSettings({ timerStop: Date.serverNow() }, true)
}
function resumeTime() {
    const shift = Date.serverNow() - timeControl.timerStop
    setSettings({ timerStart: timeControl.timerStart + shift, timerStop: 0 }, true)
}
function resetTime() {
    setSettings({ timerStart: 0, timerStop: 0 }, true)
}



buttons.startButton.onclick = function() {
    if (timeControl.timerStop > 0) {
        resumeTime()
    } else if (timeControl.timerStart === 0) {
        startTime()
    } else return
}
buttons.stopButton.onclick = function() {
    if (timeControl.timerStop === 0) {
        pauseTime()
    }
}
buttons.resetButton.onclick = function() {
    resetTime()
}

const keys: IKeyVal<boolean> = {}

document.onkeydown = function(ev) {
    const key = ev.key.toUpperCase()
    keys[key] = true
    if (onKeyChange(key, keys, ev.repeat)) {
        ev.preventDefault()
    }
}
document.onkeyup = function(ev) {
    const key = ev.key.toUpperCase()
    keys[key] = false
    if (onKeyChange(key, keys, ev.repeat)) {
        ev.preventDefault()
    }
}

function stopKeyPropagation(el: HTMLElement) {
    el.onkeydown = ev => ev.stopPropagation()
    el.onkeyup = ev => ev.stopPropagation()
}

stopKeyPropagation(urlId)
stopKeyPropagation(speakerName)
stopKeyPropagation(timeControl.green)
stopKeyPropagation(timeControl.yellow)
stopKeyPropagation(timeControl.red)
stopKeyPropagation(timeControl.overtime)

socket.on('connect', () => {
    init(id)
})
socket.on('changedSetting', (res: IResponse<ISettings>) => {
    console.log({ changedSetting: res })
    if (res.ok) {
        setSettings(res.settings)
    } else {
        console.error({ from: 'changedSetting', err: res.err })
    }
})

function init(clientID?: string | null) {
    if (socket.connected) {
        socket.emit('init', clientID, (res: IResponse<IResponseInit>) => {
            console.log({ init: res })
            if (res.ok) {
                if (res.idLock) {
                    urlId.disabled = true
                } else {
                    urlId.disabled = false
                }
                const lastID = id
                id = res.id
                urlId.value = id
                idSet = true
                serverTimeOffset = Date.now() - res.serverTime
                if (lastID != id) {
                    history.replaceState({ id }, document.title, `?${isView ? 'view&' : ''}id=${id}`)
                }
                setSettings({ ...defaultSettings, ...res.settings })
            } else {
                console.error({ from: 'init', err: res.err })
            }
        })
    } else {
        console.error('Init when not connected')
    }
}

function setSettings(settings: ISettingInput, send = false) {
    for (let key in settings) {
        setSetting(key, settings[key])
    }
    if (send) {
        sendSettings(settings)
    }
    changeTimes()
    timeCalc()
}

function setSetting<T extends keyof ISettingInput>(key: T, val: ISettingInput[T], send = false) {
    if (typeof setFns[key] == 'function') {
        if (setFns[key](val)) {
            if (send) {
                sendSettings({ [key]: val })
            }
        } else {
            console.warn(`Invalid "${key}" value. Got ${val}`)
        }
    } else {
        console.warn(`Unknown Key "${key}"`)
    }
}

function sendSettings(settings: ISettingInput) {
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
    id: string
    idLock: boolean
    serverTime: number
}
interface ISettings {
    settings: ISettingInput
}
type IKeyVal<T> = { [key: string]: T }
type ISetting = string | number | boolean
type IFn<T, K = any> = (val: T) => K
type IBadTimeInput = string | number | null | undefined

interface ISettingInput {
    timerStart?: number
    timerStop?: number
    timerGreen?: number | string
    timerYellow?: number | string
    timerRed?: number | string
    timerOvertime?: number | string
    speakerName?: string
    presetTime?: number | string
    colorOverride?: string
    [key: string]: any
}

type ISettingControl = Required<{
    [P in keyof ISettingInput]: IFn<ISettingInput[P], boolean | undefined>
}>

interface ITimePreset {
    red: string
    green: string
    yellow: string
    overtime: string
}

interface DateConstructor {
    serverNow(): number
}