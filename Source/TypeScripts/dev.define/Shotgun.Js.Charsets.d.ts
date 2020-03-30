declare namespace Shotgun.Js{
    export class Charsets {
       
        /**  转换为unicode字节数组(默认：Little endian)  */
        public static toUnicodeBytes(str: string, order?): Uint8Array ;

        /**  将unicode字节组转换成字符串（默认：LittleEndian） */
        public static fromUnicodeBytes(bin: Uint8Array, order?: ByteOrderEnum): string ;

        /** 转换为UTF8字节数组 */
        public static toUtf8Bytes(str: string): Uint8Array;

        /** 将utf8字节组转换成字符串 */
        public static fromUtf8Bytes(bin: Uint8Array):string;
  

        public static fromGBKBytes(bin: Uint8Array): string;

        /**将String转换为GBK binary数据*/
        public static toGBKBytes(str:string): Uint8Array ;

        public static toGB2312Bytes(str:string): Uint8Array ;

        /**字节数据转换为gb2312字符串(默认模式：gbk)*/
        public static fromGB2312Bytes(bin: Uint8Array, isStrict?: boolean ):string;

        public static isUnicode(bin: Uint8Array, order?: ByteOrderEnum ): boolean ;

        /**UTF-8编码规则检查*/
        public static isUtf8(bin: Uint8Array): boolean ;

        /**
        * GBK/GB2312编码规则检查
        * GB2312 两个字节都必须在区间：0xA1-0xFE
        * GBK 首字节0x81-0xfe 次字节：0x40-0xFE，但不能为0x7F
        * @param bin 待检查数据
        * @returns Encoder.Unknow/Encoder.Gb2312/Encoder.Gbk
        */
        public static getGBxName(bin: Uint8Array): Encoder ;


        /**将字节组转换为字符串*/
        public static bytesToString(bin: Uint8Array, encoder: Encoder): string ;

        /** 编码检查 */
        public static detection(bin: Uint8Array): Encoder  ;
    }

}