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

function minSecToMS(val: string) {
    let m = val.match(timeFormat)
    if (m == null) {
        return 0
    } else {
        let [, min, sec] = m
        return ((+min * 60) + +sec) * 1000
    }
}

function digitNumber(num: number, count: number) {
    return num.toFixed(0).padStart(count, '0')
}