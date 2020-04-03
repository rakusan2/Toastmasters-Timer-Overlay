const socket = io()
const controlBox = document.getElementById('controls') as HTMLDivElement | null
const urlControlBox = document.getElementById('urlControl') as HTMLDivElement | null
const selector = document.getElementById('timeSelection') as HTMLSelectElement | null
const timeControl = {
    green: document.getElementById('GreenTime') as HTMLInputElement | null,
    yellow: document.getElementById('YellowTime') as HTMLInputElement | null,
    red: document.getElementById('RedTime') as HTMLInputElement | null,
    overtime: document.getElementById('OverTime') as HTMLInputElement | null
}

const startButton = document.getElementById('timerStart')as HTMLButtonElement | null
const stopButton = document.getElementById('timerStop')as HTMLButtonElement | null
const linkCopyButton = document.getElementById('copyLink') as HTMLButtonElement | null

const params = getParams()
const isView = typeof params.view === 'string'

controlBox?.classList.toggle('hide',isView)
urlControlBox?.classList.toggle('hide',isView)

function getParams(){
    const params:{[key:string]:string}= {}
    document.URL.split('?').slice(1).forEach(a=>{
        const [key, val] = a.split('=').map(a=>a.trim())
        params[key] = val
    })
    return params
}

console.log({params, isView})