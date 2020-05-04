import { send, on } from './socket';
import { setSettings } from './settings';
import uriBox from './uriBox'
import './controlBox'

let id = 'aaaa'
let serverTimeOffset = 0

on('connect', init)

uriBox.idDiv.addEventListener('change', function(ev) {
    id = this.value
    init()
})

async function init() {
    console.log('Initializing')
    const res = await send('init', id)
    if (res.ok) {
        serverTimeOffset = Date.now() - res.serverTime
        id = res.id
        uriBox.setID(res.id)
        uriBox.lock(res.idLock)
        setSettings(res.settings)
    } else {
        console.error(res.err)
    }
}

Date.serverNow = function() {
    return this.now() - serverTimeOffset
}