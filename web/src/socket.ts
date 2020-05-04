import { ISocketResponse } from './types'

const socket = io()
export function send<T extends keyof ISocketResponse>(key: T, ...values: any[]) {
    return new Promise<ISocketResponse[T]>((res, rej) => {
        if (socket.connected) {
            socket.emit(key, ...values, (resp: ISocketResponse[T]) => res(resp))
        } else {
            rej('The Socket is not Connected')
        }
    })
}

export function on(key: string, fun: () => any) {
    socket.on(key, fun)
}