
/**
 * 仿C#MemoryStream
 * @param {UInt8Array} bin 已经存在的数流
*/
class MemoryStream {
    private _data: Int8Array = null;
    /**读取点位置 */
    public position: number = 0;
    /**是否采用Big-Endian方式读取,默认：false*/
    public bigEndian: boolean = false;

    constructor(bin: Uint8Array) {
        this._data = bin;
    }
    getLength() { return this._data.length; }
    /**原始数据 */
    public baseArray(): Uint8Array { return this._data; }

    /**
     * 移动光标
     * @param {number} offset 偏移量
     * @param {number} pos 位置 0，当前位置，1：开头(绝对位置)。2：结尾
     */
    seek(offset: number, pos: number): void {
        switch (pos) {
            case 1: this.position = offset; break;
            case 2: this.position = this.getLength() + offset; break;
            default: this.position += offset; break;
        }
        if (this.position < 0)
            this.position = 0;
    }
    endOfStream(): boolean { return this.position >= this._data.length; }
    /**@returns {Number} -1为读取失败 */
    readByte(): number {
        if (this.endOfStream()) return -1;
        return this._data[this.position++];
    }
    public readBytes(size: number): Uint8Array {
        if (size + this.position > this.getLength()) return null;
        var buf: Uint8Array;
        if (typeof Uint8Array == 'undefined')
            buf = <any>new Array<number>();
        else
            buf = new Uint8Array(size);
        for(var i=0;i<size;i++){
            buf[i]=this._data[this.position++];
        }
        return buf;
    }

    /** 读取一个Int32数据
     * 超出位置时交抛出错误
     @returns {number} 有符号32位整数 */
    readInt32(): number {
        if (this._data.length - this.position < 4) throw { "message": "剩余数据不足4byte" };
        var x = 0;
        if (this.bigEndian) {
            x = this._data[this.position++] << 24;
            x |= this._data[this.position++] << 16;
            x |= this._data[this.position++] << 8;
            x |= this._data[this.position++];
        } else {
            x = this._data[this.position++];
            x |= this._data[this.position++] << 8;
            x |= this._data[this.position++] << 16;
            x |= this._data[this.position++] << 24;
        }
        return x;
    }
    /** 读取一个UInt32数据
     * 超出位置时交抛出错误
     @returns {number} 无符号32位整数 */
    readUInt32(): number { return this.readInt32() >>> 0; }

    /** 读取一个UInt16数据
    * 超出位置时交抛出错误
    @returns {number} 无符号16位整数 */
    readUInt16(): number {
        if (this._data.length - this.position < 2) throw { "message": "剩余数据不足2byte" };
        var x = 0;
        if (this.bigEndian) {
            x = this._data[this.position++] << 8;
            x |= this._data[this.position++];
        } else {
            x = this._data[this.position++];
            x |= this._data[this.position++] << 8;
        }

        return x;
    }


}