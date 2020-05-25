declare class MemoryStream {

    position: number;
    /**是否采用Big-Endian方式读取,默认：false*/
    bigEndian: boolean;

    constructor(bin: Uint8Array);
    getLength();
    /**原始数据 */
    baseArray(): Uint8Array;

    /**
     * 移动光标
     * @param {number} offset 偏移量
     * @param {number} pos 位置 0，当前位置，1：开头(绝对位置)。2：结尾
     */
    seek(offset: number, pos: number): void;
    endOfStream(): boolean;
    /**@returns {Number} -1为读取失败 */
    readByte(): number;
    readBytes(size: number): Uint8Array;

    /** 读取一个Int32数据
     * 超出位置时交抛出错误
     @returns {number} 有符号32位整数 */
    readInt32(): number;
    /** 读取一个UInt32数据
     * 超出位置时交抛出错误
     @returns {number} 无符号32位整数 */
    readUInt32(): number;

    /** 读取一个UInt16数据
    * 超出位置时交抛出错误
    @returns {number} 无符号16位整数 */
    readUInt16(): number;

    newLineMode: NewLineEnum;
    Encoding: Encoder;
    readLine(encode?: Encoder): string;
}
