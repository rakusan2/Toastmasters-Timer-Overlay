import { Server } from 'socket.io'
import parameters from './preLoad'
import handler = require('serve-handler')
import { IServeHandler } from './serverTypes'

const { cache, port, sslConfig } = parameters

const dir = __dirname.split(/\\|\//).slice(0, -2)
const webDir = dir.join('/') + "/web"
console.log('Web: ' + webDir)

const handlerConfig: IServeHandler = {
    public: webDir,
    cleanUrls: true,
    etag: true,
    unlisted: [
        "src",
        "tsconfig.json"
    ]
}

if (cache != null) {
    handlerConfig.headers = [
        {
            source: '*',
            headers: [
                { key: 'Cache-Control', value: `max-age=${cache}` }
            ]
        }
    ]
}

export default function startServer(afterStart?: (address: string) => any) {
    let server: import('http').Server
    let io: Server
    if (sslConfig != null) {
        const https = require('https') as typeof import('https')
        server = https.createServer(sslConfig, (req, res) => {
            handler(req, res, handlerConfig)
        })
        io = new Server(server)
    }
    else {
        const http = require('http') as typeof import('http')
        server = http.createServer((req, res) => {
            handler(req, res, handlerConfig)
        })
        io = new Server(server)
    }

    server.listen(port, () => {
        const address = `${sslConfig != null ? 'https' : 'http'}://localhost:${port}`
        console.log(`listening at ${address} with cache set to ${cache ?? 'DISABLED'}`)

        if (afterStart != null) afterStart(address)
    })

    server.on('close', () => console.log('Closing'))

    return io
}