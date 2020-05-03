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

function onKeyChange(changedKey: string, keys: IKeyVal<boolean>, isRepeat: boolean) {
    if (!isRepeat) {
        let tempColorOverride = ''
        if (keys['R'] || keys['3']) {
            tempColorOverride = 'red'
        } else if (keys['Y'] || keys['2']) {
            tempColorOverride = 'yellow'
        } else if (keys['G'] || keys['1']) {
            tempColorOverride = 'green'
        }

        if (colourOverride != tempColorOverride) {
            setSetting('colorOverride', tempColorOverride, true)
        }

        redrawUI()

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