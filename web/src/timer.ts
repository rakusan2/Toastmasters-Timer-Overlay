
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