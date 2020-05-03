let reDrawInProgress = false

function redrawUI() {
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

function requestNextFrame() {
    if (!reDrawInProgress) {
        reDrawInProgress = true
        window.requestAnimationFrame(() => {
            reDrawInProgress = false
            redrawUI()
        })
    }
}

function selectPreselect(selector: HTMLSelectElement, val: any) {
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

function setStartButtonText() {
    const textNode = buttons.startButton.firstChild as Text
    if (timeControl.timerStart > 0 && timeControl.timerStop > 0) {
        textNode.data = 'Resume'
    } else {
        textNode.data = 'Start'
    }
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
        urlId.value = pageID ?? ''
    }
}

speakerName.onchange = function() {
    const val = speakerName.value.trim()
    sendSettings({ speakerName: val })
}

buttons.startButton.onclick = function() {
    if (timeControl.timerStart > 0 && timeControl.timerStop > 0) {
        resumeTime()
    } else if (timeControl.timerStart === 0) {
        startTime()
    } else return
}
buttons.stopButton.onclick = function() {
    if (timeControl.timerStart > 0 && timeControl.timerStop === 0) {
        pauseTime()
    }
}
buttons.resetButton.onclick = function() {
    resetTime()
}
buttons.linkCopyButton.onclick = function() {
    navigator?.permissions?.query?.({ name: 'clipboard-write' } as any)
        .then(res => {
            if (res.state === 'granted' || res.state === 'prompt') {
                navigator.clipboard.writeText(`${HOST}?view&id=${pageID}`)
                urlId.classList.toggle('green-bg', true)
                setTimeout(() => urlId.classList.toggle('green-bg', false), 500)
            }
        })
}

selector.onchange = () => {
    if (changeTimes()) {
        sendSettings({ presetTime: selector.value })
    }
    redrawUI()
}