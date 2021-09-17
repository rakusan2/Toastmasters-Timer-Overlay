export default class BufBuilder {
    arr: number[] = []
    addByte(byte: number) {
        if (byte < 0) byte = 0
        this.arr.push(byte & 0xff)
        return this
    }
    /**
     * Adds Big-Endian encoded number to buffer
     * 
     * Negative numbers are encoded as 0
     * @param byteCount Number of bytes to encode. Default 4
     */
    addUInt(num: number, byteCount?: number) {
        if (num < 0) num = 0
        return this.addInt(num, byteCount)
    }
    addUBigInt(num: bigint, byteCount?: number){
        if(num < 0)  num = 0n
        return this.addBigInt(num, byteCount)
    }
    /**
     * Adds Big-Endian encoded number to buffer
     * @param byteCount Number of bytes to encode. Default 4
     */
    addInt(num: number, byteCount = 4) {
        if (byteCount < 1 || byteCount > 7) throw new Error(`Invalid byteCount 1 <= ${byteCount} <= 7`)
        byteCount &= 0xf
        let shift = (byteCount - 1) * 8
        for (; shift >= 0; shift -= 8) {
            this.arr.push((num >> shift) & 0xff)
        }
        return this
    }
    addBigInt(num: bigint, byteCount = 4) {
        if (byteCount < 1 || byteCount > 7) throw new Error(`Invalid byteCount 1 <= ${byteCount} <= 7`)
        byteCount &= 0xf
        let shift = BigInt((byteCount - 1) * 8)
        for (; shift >= 0; shift -= 8n) {
            this.arr.push(Number((num >> shift) & 0xFFn))
        }
        return this
    }
    /** 
     * Adds string to buffer following the byte length
     * @param encoding The encoding of the string. Default UTF-8
     */
    addString(str: string, encoding: BufferEncoding = 'utf8') {
        const buf = Buffer.from(str, encoding)
        const len = buf.byteLength
        if (len > 0xff) throw new Error('str is too long')
        this.arr.push(len, ...buf)
        return this
    }
    build() {
        return Buffer.from(this.arr)
    }
    toString() {
        return this.arr.map(a => a.toString(16)).join(' ')
    }
}