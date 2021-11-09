import { send, on } from './socket';
import { setSettings, initSettings } from './settings';
import uriBox from './uriBox'
import controlBox from './controlBox'
import params from './params'
import userDropdown from './userDropdown';
import menu from './menu'

const isView = typeof params.view != 'undefined'
let id = params.id ?? null

if (isView) {
    controlBox.hide()
    uriBox.hide()
    userDropdown.hide()
    menu.hide()
}
(<any>window).userDropdown = userDropdown
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

on('newVersion', (newVersion: { version: string, link: string }) => {
    menu.setNewVersion(newVersion)
})

uriBox.idDiv.addEventListener('change', function(ev) {
    id = this.value
    init()
})

async function init() {
    console.log('Initializing')
    const res = await send('init', id)
    console.log('Init Data', res)
    if (res.ok) {
        const lastId = id
        id = res.id
        if (lastId != id) {
            history.replaceState({ id }, document.title, `?${isView ? 'view&' : ''}id=${id}`)
        }
        uriBox.setID(res.id)
        uriBox.lock(res.idLock)
        initSettings(res.settings)
        menu.setVersion(res.version)
        if (res.newVersion != null) {
            menu.setNewVersion(res.newVersion)
        }
    } else {
        console.error(res.err)
    }
}