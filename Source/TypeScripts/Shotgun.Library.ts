// interface ILibrary { parseHex(str: string): Array<number>; }
namespace Shotgun.Js {
    /**针对Shotgun.Js的TS定义 */
    export declare class Base64 {
        static decode(b64str: string): Uint8Array
        static encode(bin: Uint8Array): string
    };
    export declare class Charsets {
        static isAscii(stm: Uint8Array): boolean
        static isUtf8(stm: Uint8Array): boolean
        static getGBxName(stm: Uint8Array): string
        static isUnicode(stm: Uint8Array): boolean
        static fromUtf8Bytes(bin: Uint8Array): string
        static fromUnicodeBytes(bin: Uint8Array): string
        static fromGB2312Bytes(bin: Uint8Array): string
        static toUtf8Bytes(str: string): Uint8Array
        static bytesToString(bin: Uint8Array, ecncode: Encoder): string
    }

    export class Library {
        public static parseHex(hexStr: string): Array<number> {
            var bin = new Array<number>();
            var spliter = [',', '-', ' ', '\n', '\r', '\t', ';', ':', '\'', '"', '\\'];
            var iLow = true, has = false;
            var val = 0, line = 1, col = 0;
            var tmp: number;

            for (var i = 0; i < hexStr.length; i++) {
                var c = hexStr.charAt(i);
                col++;
                if (spliter.indexOf(c) > -1) {
                    if (c === "\r" || c === "\n") { line++; col = 0; }
                    if (has) bin.push(val);
                    has = false;
                    iLow = true;
                    continue;
                }
                if (c == 'x') {
                    if (!has) continue; //比如 0x
                    if (val != 0)
                        bin.push(val);
                    has = false;
                    iLow = true;
                    continue;
                }
                has = true;
                tmp = parseInt(c, 16);
                if (isNaN(tmp))
                    throw { message: "Invalid hex character:\"".concat(c, "\"\nRow:", <any>line, ", Col:", <any>col) };

                if (iLow) {
                    val = tmp;
                    iLow = false;
                    continue;
                }
                val <<= 4;
                val |= parseInt(c, 16);
                bin.push(val);
                iLow = true;
                has = false;
            }
            if (has)
                bin.push(val);
            return bin;
        }


        public static isNullOrEempty(str: string): boolean {
            return str == null || str.length == 0;
        }
        public static byteSize(size: number, fractionDigits: number = 2): string {
            if (size < 1024) return size.toString();

            var times = -1;
            while (size >= 1024) {
                size /= 1024;
                times++;
            }
            return size.toFixed(fractionDigits).concat("KMGTP".substr(times,1));
        }


    }
}
