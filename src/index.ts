import * as http from 'http'
import * as express from 'express'
import * as socket from 'socket.io'

const PORT = 8888

const app = express()
const web = http.createServer(app)
const io = socket(web)

const path = __dirname.split('\\').slice(0,-1).join('\\') + '\\web'

app.get('/', (req,res)=> res.sendFile(path + '\\index.html'))
app.get('/style.css', (req,res)=> res.sendFile(path+'\\style.css'))
app.get('/web.js', (req,res)=> res.sendFile(path+'\\web.js'))

web.listen(PORT, ()=>{
    console.log(`listening at http://localhost:${PORT} with web at ${path}`)
})