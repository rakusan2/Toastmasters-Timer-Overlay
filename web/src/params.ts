export function getParams() {
    const params: { [key: string]: string | null } = {}
    document.URL.split('?').slice(1).forEach(query => {
        query.split('&').forEach(part => {
            const [key, val] = part.split('=').map(a => a.trim())
            if (key.length > 0) {
                params[key] = val ?? null
            }
        })
    })
    return params
}

export default getParams()