declare namespace Shotgun.Js.Security {
    class Asn1Oid {
        public static getInfo(oid: string): IASN1OID
    }
}

interface IASN1Object {
    /**调用层级索引id*/
    index: string,
    type: ASN1Type,
    /**数据长度 */
    dataLength: number,
    /**节点偏移量*/
    nodeOffset:number,
    /**节点值偏移量 */
    offset: number,
    /**节点值 */
    value: string | number | IASN1Object[] | boolean | Uint8Array,
    /**类别，高两位 */
    class: number,
    isConstructed: boolean,
    isHexVaule: boolean,
    inComplete:boolean,
    isEoc:boolean,
    /**未定长度节点 */ 
    isChunked:boolean,
    /**签名符，原始字符位 */
    sign:number
}

interface IASN1OID {
    id: string,
    comment: string,
    description:string
}
declare enum ASN1Type {
    EOC = 0x00,
    BOOLEAN = 0x01,
    INTEGER = 0x02,
    BIT_STRING = 0x03,
    OCTET_STRING = 0x04,
    NULL = 0x05,
    OBJECT_IDENTIFIER = 0x06,
    OBJECT_DESCRIPTOR = 0x07,
    EXTERNAL = 0x08,
    REAL = 0x09,
    ENUMERATED = 0x0A,
    EMBEDDED_PDV = 0x0B,
    UTF8_STRING = 0x0C,
    SEQUENCE = 0x10,
    SET = 0x11,
    NUMERIC_STRING = 0x12,
    PRINTABLE_STRING = 0x13,
    TELETEX_STRING = 0x14,
    VIDEOTEX_STRING = 0x15,
    IA5_STRING = 0x16,
    UTC_TIME = 0x17,
    GeneralizedTime = 0x18,
    GRAPTHIC_STRING = 0x19,
    VISIBLE_STRING = 0x1A,
    GENERAL_STRING = 0x1B,
    UNIVERSAL_STRING = 0x1C,
    BMP_STRING = 0x1E
}
