import { ISocketResponse, IResponseERR, ISocketListener } from './types'
import io from "socket.io-client";
const socket = io()
export function send<T extends keyof ISocketResponse>(key: T, ...values: any[]) {
    return new Promise<ISocketResponse[T]>((res, rej) => {
        if (socket.connected) {
            socket.emit(key, ...values, (resp: ISocketResponse[T]) => {
                if (!resp.ok) {
                    console.error({ from: key, err: (<IResponseERR>resp).err })
                }
                res(resp)
            })
        } else {
            rej('The Socket is not Connected')
        }
    })
}

export function on(key: string, fun: (...val: any[]) => any) {
    socket.on(key, fun)
}