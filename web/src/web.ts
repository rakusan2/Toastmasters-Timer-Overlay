import { send, on } from './socket';
import { setSettings, initSettings } from './settings';
import uriBox from './uriBox'
import controlBox from './controlBox'
import { getParams } from './util';

const params = getParams()
const isView = typeof params.view != 'undefined'
let id = params.id ?? null
let serverTimeOffset = 0

if (isView) {
    controlBox.hide()
    uriBox.hide()
}

console.log({ id, isView, params })

on('connect', init)
on('changedSetting', (res) => {
    if (res.ok) {
        console.log({ changedSettings: res.settings })
        setSettings(res.settings, false)
    } else {
        console.error({ from: 'changedSettings', err: res.err })
    }
})

uriBox.idDiv.addEventListener('change', function(ev) {
    id = this.value
    init()
})

async function init() {
    console.log('Initializing')
    const res = await send('init', id)
    if (res.ok) {
        const lastId = id
        serverTimeOffset = Date.now() - res.serverTime
        id = res.id
        if (lastId != id) {
            history.replaceState({ id }, document.title, `?${isView ? 'view&' : ''}id=${id}`)
        }
        uriBox.setID(res.id)
        uriBox.lock(res.idLock)
        initSettings(res.settings)
    } else {
        console.error(res.err)
    }
}

Date.serverNow = function() {
    return this.now() - serverTimeOffset
}