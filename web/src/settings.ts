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
        return selectPreselect(selector, val)
    },
    colorOverride(val) {
        if (val === 'green' || val === 'yellow' || val === 'red' || val === '') {
            colourOverride = val
            return true
        }
        return false
    },
    addSpeaker(val) {
        if (val == null) return false
        if (Array.isArray(val)) {
            const ret = val.reduce((acc, a) => acc || (this.addSpeaker(a) ?? false), false)
            return ret
        } else if (typeof val == 'object') {
            let name = '', time = '', preset: number | string = 0
            if (typeof val.name == 'string') {
                name = val.name
            }
            if ((typeof val.time == 'string') || (typeof val.time == 'number')) {
                time = fixTime(val.time)
            }
            if ((typeof val.preset == 'string') || (typeof val.preset == 'number')) {
                preset = val.preset
            }
            const speaker = createSpeaker(name, preset, time)

        }
        return false
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
    redrawUI()
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
