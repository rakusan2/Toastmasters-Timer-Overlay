import { IResponse, ISettings, IResponseInit } from './types'

const HOST = 'localhost:8888'
const socket = io()

let idSet = false
let colourOverride: 'red' | 'yellow' | 'green' | 'white' | '' = ''

let serverTimeOffset = 0
Date.serverNow = function() {
    return Date.now() - serverTimeOffset
}

if (!isView) {
    controlHead.prepend(selector)
}

controlBox.classList.toggle('hide', isView)
urlControlBox.classList.toggle('hide', isView)
dropdownControl.classList.toggle('hide', isView)

function getPresetTxt(preset: number | string) {
    // TODO
    return ''
}

function getPresetKey(preset: number | string) {
    // TODO
    return ''
}

console.log({ params, isView })

socket.on('connect', () => {
    init(pageID)
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
                const lastID = pageID
                pageID = res.id
                urlId.value = pageID
                idSet = true
                serverTimeOffset = Date.now() - res.serverTime
                if (lastID != pageID) {
                    history.replaceState({ id: pageID }, document.title, `?${isView ? 'view&' : ''}id=${pageID}`)
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
