import { IParamOptions, IKeyVal } from './types';

type IOptions = IKeyVal<IParamOptions>

export function params(params: IOptions) {
    const { named, keyed } = separate(params)

    const [, ...args] = process.argv

}

function separate(params: IOptions): { named: IOptions, keyed: IOptions } {
    const named: IKeyVal<IParamOptions> = {}
    const keyed: IKeyVal<IParamOptions> = {}

    for (const name in params) {
        const param = params[name]
        let { keyword, alias = [] } = param

        if (typeof alias === 'string') {
            alias = [alias]
        }

        named[name] = param

        for (let i = 0; i < alias.length; i++) {
            const a = alias[i]
            if (typeof named[a] !== 'undefined') {
                throw new Error('Duplicate Alias')
            } else {
                named[a] = param
            }
        }

        if (typeof keyword === 'string' && keyword.length > 0) {
            if (typeof keyed[name] !== 'undefined') {
                throw new Error('Duplicate Keyword')
            }
            keyed[name] === param
        }
    }
    return { named, keyed }
}