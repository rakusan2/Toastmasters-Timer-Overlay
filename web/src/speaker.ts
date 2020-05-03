let speakers: ISpeaker[] = []

function createSpeaker(name = '', preset: string | number = 0, time = ''): ISpeaker {
    const speakerDiv = document.createElement('div')
    const topDiv = document.createElement('div')
    const nameDiv = document.createElement('div')
    const timeDiv = document.createElement('div')
    const presetDiv = document.createElement('div')
    const nameTxt = document.createTextNode(name)
    const timeTxt = document.createTextNode(time)
    let sel: Text | HTMLSelectElement

    nameDiv.classList.add('speaker-name')
    nameDiv.appendChild(nameTxt)

    timeDiv.classList.add('speaker-time')
    timeDiv.appendChild(timeTxt)

    topDiv.classList.add('speaker-top')
    topDiv.append(nameDiv, timeDiv)

    presetDiv.classList.add('speaker-preset')

    if (isView) {
        sel = document.createTextNode(getPresetTxt(preset))
        presetDiv.appendChild(sel)
    } else {
        sel = (<DocumentFragment>selectorTemplate.content.cloneNode(true)).firstElementChild as HTMLSelectElement
        sel.value = getPresetKey(preset)
        presetDiv.append(sel)
    }

    speakerDiv.classList.add('speaker')
    speakerDiv.append(topDiv, presetDiv)

    return {
        speakerDiv,
        name: nameTxt,
        time: timeTxt,
        preset: sel
    }
}