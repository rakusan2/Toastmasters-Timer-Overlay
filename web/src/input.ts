type KeyFunc = (data: KeyData, event: KeyboardEvent) => any
type GPadFunc = (data: GPadData, gamepad: Gamepad) => any
type InputFunc = KeyFunc | GPadFunc
type GPadConnectFunc = (index: number, gPad: GPadEverything) => any
type GPadDisconnectFunc = (index: number) => any



/*
Up	-1
UR      -0.71429
Right	-0.42857
DR      -0.14286
Down	0.14286
DL      0.42857
Left	0.71429
UL      1
N	1.28571
*/

const gPadButtonNames = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LS', 'RS', 'BACK', 'START', 'UP', 'DOWN', 'LEFT', 'RIGHT']
const gPadAxisNames = ['LY', 'LX', 'RY', 'RX', 'LT', 'RT']

const gamepads: ({ gamepad: Gamepad, data: GPadEverything, timestamp: number } | null)[] = []
const gPadConnectListeners: GPadConnectFunc[] = []
const gPadDisconnectListeners: GPadDisconnectFunc[] = []
const gamepadDeadZone = { val: 0.1, round: false }

const keysPressed = new Set<string>()

document.addEventListener('keydown', ev => {
    const key = ev.key.toLowerCase()
    keysPressed.add(key)
    const keys = Array.from(keysPressed)
    callKeyHandlers(keys, true, ev)
})

document.addEventListener('keyup', ev => {
    const key = ev.key.toLowerCase()
    const keys = Array.from(keysPressed)
    keysPressed.delete(key)
    callKeyHandlers(keys, false, ev)
})

export function initKeyboard(node: GlobalEventHandlers) {
    node.addEventListener('keyup', ev => {

    })
}

function setupKey(key: IKeyConfig | string, fun: InputFunc) {
    const config = (typeof key === 'string') ? { name: key, down: true } : key
    // TODO
}

function setupGPad(key: IGPadConfig | string | GPadAnalog, fun: InputFunc) {
    let config = getGPadConfig(key)
    // TODO
}

function callKeyHandlers(keys: string[], down: boolean, event: KeyboardEvent) {
    // TODO
}

function callGPadHandlers() {
    // TODO
}

function getGPadConfig(config: IGPadConfig | string | GPadAnalog): IGPadConfig {
    if (typeof config === 'number') {
        return { axis: config }
    }
    if (typeof config === 'string') {
        const { buttons, axis, badParts } = splitGPadStr(config)

        if (badParts.length > 0) throw new Error(`Unknown button or Axis ${badParts.map(a => `"${a}"`).join(', ')}`)
        const buttonStr = buttons.join('+')
        return {
            button: buttons.length > 0 ? buttons.join('+') : void 0,
            axis: axis.length > 0 ? axis.join('+') : void 0,
            down: true
        }
    }
    const { button, axis } = config
    if (button != null) {
        const parts = splitGPadStr(button)
        if (parts.badParts.length > 0 || parts.axis.length > 0) {
            throw new Error(`Unknown button ${[...parts.badParts, ...parts.axis].map(a => '"' + a + '"').join(', ')}`)
        }
        config.button = parts.buttons.join('+')
    }
    if (typeof axis === 'string') {
        const parts = splitGPadStr(axis)
        if (parts.badParts.length > 0 || parts.buttons.length > 0) {
            throw new Error(`Unknown button ${[...parts.badParts, ...parts.buttons].map(a => '"' + a + '"').join(', ')}`)
        }
        config.axis = parts.axis.join('+')
    }
    return config
}

function splitGPadStr(str: string) {
    const parts = str.toUpperCase().split('+')
    let buttons: string[] = [],
        axis: string[] = [],
        badParts: string[] = []
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (gPadButtonNames.includes(part)) buttons.push(part)
        else if (gPadAxisNames.includes(part)) axis.push(part)
        else badParts.push(part)
    }
    buttons.sort()
    axis.sort()
    return {
        buttons,
        axis,
        badParts
    }
}

let gPadIsInit = false

function initGPad() {
    if (gPadIsInit) return
    gPadIsInit = true
    // TODO
}

function convertGPadStick(x: number, y: number, gpButton?: GamepadButton): GPadStick {
    const { round, val } = gamepadDeadZone
    const button = gpButton != null ? gpButton.pressed : false
    if (round) {
        const radius = (x * x) + (y * y)
        if (val * val > radius) return {
            x: 0,
            y: 0,
            button
        }
        return {
            x,
            y,
            button
        }
    }
    return {
        x: x > val ? x : x < -val ? x : 0,
        y: y > val ? y : y < -val ? y : 0,
        button
    }
}

function convertGPadData(gamepad: Gamepad): { gamepad: Gamepad, data: GPadEverything, timestamp: number } {
    if (gamepad.axes.length >= 10) {
        return {
            gamepad,
            data: convertGPadDataFirefox(gamepad),
            timestamp: gamepad.timestamp
        }
    }
    return {
        gamepad,
        data: convertGPadDataCommon(gamepad),
        timestamp: gamepad.timestamp
    }
}

function convertGPadDataCommon(gPad: Gamepad): GPadEverything {
    const { buttons, axes } = gPad
    return {
        a: buttons[0].pressed,
        b: buttons[1].pressed,
        x: buttons[2].pressed,
        y: buttons[3].pressed,
        leftButton: buttons[4].pressed,
        rightButton: buttons[5].pressed,
        leftTrigger: buttons[6].value,
        rightTrigger: buttons[7].value,
        back: buttons[8].pressed,
        start: buttons[9].pressed,
        leftStick: convertGPadStick(axes[0], axes[1], buttons[10]),
        rightStick: convertGPadStick(axes[2], axes[3], buttons[11]),
        dPad: {
            up: buttons[12].pressed,
            down: buttons[13].pressed,
            left: buttons[14].pressed,
            right: buttons[15].pressed
        }
    }
}
function convertGPadDataFirefox(gPad: Gamepad): GPadEverything {
    const { buttons, axes } = gPad
    return {
        x: buttons[0].pressed,
        a: buttons[1].pressed,
        b: buttons[2].pressed,
        y: buttons[3].pressed,
        leftButton: buttons[4].pressed,
        rightButton: buttons[5].pressed,
        leftTrigger: (axes[3] + 1) / 2,
        rightTrigger: (axes[4] + 1) / 2,
        back: buttons[8].pressed,
        start: buttons[9].pressed,
        leftStick: convertGPadStick(axes[0], axes[1], buttons[10]),
        rightStick: convertGPadStick(axes[2], axes[5], buttons[11]),
        dPad: gamepadAxisToDPad(axes[9])
    }
}

function gamepadAxisToDPad(axis: number): GPadDPad {
    let up = false,
        down = false,
        left = false,
        right = false

    if (axis === 1) {
        up = true
        left = true
    } else if (axis > 0.6) {
        left = true
    } else if (axis > 0.3) {
        down = true
        left = true
    } else if (axis > 0) {
        down = true
    } else if (axis > -0.3) {
        down = true
        right = true
    } else if (axis > -0.6) {
        right = true
    } else if (axis > -1) {
        up = true
        right = true
    } else {
        up = true
    }
    return { up, down, left, right }
}


/**
 * Set function to be called when an input changes
 * @param config Which change calls the function
 * @param fun callback function
 * @returns passed callback function
 */
export function onInput({ key, gPad }: IInputObj, fun: InputFunc): InputFunc {
    if (key != null) {
        if (Array.isArray(key)) {
            key.forEach(a => setupKey(a, fun))
        } else setupKey(key, fun)
    }
    if (gPad != null) {
        if (Array.isArray(gPad)) {
            gPad.forEach(a => setupGPad(a, fun))
        } else setupGPad(gPad, fun)
    } else throw new Error('Missing Input Config Object')
    return fun
}

/**
 * Set Function to be called on connected gamepads
 * @param fun callback function
 * @param ignoreCurrent Do not call with current gamepads
 * @returns passed callback function
 */
export function onGPadConnect(fun: GPadConnectFunc, ignoreCurrent = false) {
    gPadConnectListeners.push(fun)

    if (!ignoreCurrent) {
        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (gp != null) fun(i, gp.data)
        }
    }
    return fun
}

/**
 * Set function to be called when a gamepad disconnects
 * @param fun callback function
 * @returns passed callback function
 */
export function onGPadDisconnect(fun: GPadDisconnectFunc) {
    gPadDisconnectListeners.push(fun)
    return fun
}

export function onKeyDown(key: string | string[], fun: KeyFunc): KeyFunc
export function onKeyDown(key: string | string[], repeat: boolean, fun: KeyFunc): KeyFunc
export function onKeyDown(key: string | string[], repeat: boolean | KeyFunc, fun?: KeyFunc): KeyFunc {

    if (typeof repeat === 'function') {
        fun = repeat
        repeat = false
    }
    if (typeof fun !== 'function') throw new Error('No Function Passed')
    setupKey({ name: key, repeat, down: true }, fun)

    return fun
}

export function onKeyUp(key: string | string[], fun: KeyFunc): KeyFunc
export function onKeyUp(key: string | string[], repeat: boolean, fun: KeyFunc): KeyFunc
export function onKeyUp(key: string | string[], repeat: boolean | KeyFunc, fun?: KeyFunc): KeyFunc {

    if (typeof repeat === 'function') {
        fun = repeat
        repeat = false
    }
    if (typeof fun !== 'function') throw new Error('No Function Passed')
    setupKey({ name: key, repeat, up: true }, fun)

    return fun
}

export function onKey(key: string | string[], fun: KeyFunc): KeyFunc
export function onKey(key: string | string[], repeat: boolean, fun: KeyFunc): KeyFunc
export function onKey(key: string | string[], repeat: boolean | KeyFunc, fun?: KeyFunc): KeyFunc {

    if (typeof repeat === 'function') {
        fun = repeat
        repeat = false
    }
    if (typeof fun !== 'function') throw new Error('No Function Passed')
    setupKey({ name: key, repeat, up: true, down: true }, fun)

    return fun
}

export function isKeyDown(key: string) {
    return keysPressed.has(key.toLowerCase())
}

export function getGPadData(index: number) {
    if (index < 0 || index >= gamepads.length) return null
    const gPad = gamepads[index]
    if (gPad == null) return null
    return gPad.data
}

type IMayArr<T> = T | T[]

interface IKeyCallbacks {
    [key: string]: {
        up?: {
            callback: KeyFunc
            repeat?: boolean
        }
        down?: {
            callback: KeyFunc
            repeat?: boolean
        }
    }
}

interface IKeyConfig {
    name: string | string[],
    repeat?: boolean,
    down?: boolean,
    up?: boolean
}

interface IGPadConfig {
    button?: string,
    axis?: string | GPadAnalog | {
        name: string | GPadAnalog
        val: number
    },
    dir?: boolean | {
        dPad?: boolean
        leftStick?: number | boolean
        rightStick?: number | boolean
    }
    stick?: {
        left?: boolean
        right?: boolean
    }
    repeat?: boolean
    down?: boolean
    up?: boolean
}

interface IInputObj {
    key?: IMayArr<string | IKeyConfig>
    gPad?: IMayArr<string | GPadAnalog | IGPadConfig>
}

interface KeyData {
    type: 0
    key: string
    down: boolean
    repeat: boolean
}
interface GPadData {
    type: 1
    button?: string
    dir?: { x: number, y: number }
    axis?: { name: GPadAnalog, val: number }
    stick?: { x: number, y: number, right: boolean }
    down: boolean
    repeat: boolean
    data: GPadEverything
}

interface GPadEverything {
    a: boolean
    b: boolean
    x: boolean
    y: boolean
    back: boolean
    start: boolean
    dPad: GPadDPad
    leftStick: GPadStick
    rightStick: GPadStick
    leftTrigger: number
    rightTrigger: number
    leftButton: boolean
    rightButton: boolean
}
interface GPadStick {
    x: number
    y: number
    button: boolean
}
interface GPadDPad {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
}
export const enum GPadAnalog {
    LeftX,
    LeftY,
    RightX,
    RightY,
    LT,
    RT
}