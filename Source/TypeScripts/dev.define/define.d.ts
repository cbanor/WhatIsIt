declare interface StringConstructor {
    isNullOrEmpty(str: String): boolean
    format(str: String, ...args: any): string
}

declare interface LanguageX {
    public: any
    base64: any
    cryptography: any,
    keyConverter: any,
    regular: any
}
declare interface Window {
    xLang: LanguageX
}
declare class $Localizer {
    static get(fmt: string, ...args: any[]): string;
    static libGet<K extends keyof LanguageX>(libName: K, fmt: keyof LanguageX[K], ...args: any[]): string;
}

/**字符编码定义*/
declare enum Encoder {
    Utf8 = 0,
    Gb2312 = 2,
    Gbk = 3,
    Ascii = 4,
    /**默认方式，同Unicode_LE */
    Unicode = 1,
    Utf16_BE = 10,
    Utf16_LE = Unicode,
    Base64 = 0x100,
    Hex = 0x101,
    Unknow = 0xffffFFff
}

/**字节排序方式 */
declare enum ByteOrderEnum {
    LittleEndian = 0,
    BigEndian = 1
}

declare enum NewLineEnum {
    /**0x0a */
    A = 1,
    /**0x0d */
    D = 2,
    /**0x0d 0x0a */
    DA = 3,
    /**混模方式，以上都有可能*/
    Mixed = 0xffff
}

declare function checkBase64(str: string): number;
declare function checkHex(str: string): number;
declare function Toast(msg: string, delay?: number, cssName?: string): object;

declare interface IHexFormatOptions { withAscii?: boolean, noHead?: boolean, width?: number, preChar?: string, spliter?: string }
declare function bytesToHex(bin: Uint8Array, options?: IHexFormatOptions): string;


/**WhatIs识别结果 */
declare interface IWhatIsItResult {
    /**文字编码 */
    chartSet?: Encoder;
    /**附加属性 */
    results?: Array<IWhatIsPluginResult>;
    /**说明信息 */
    message: string;
    /**是否处理成功 */
    isSuccess: boolean;
}
/**文件信息*/
declare interface IFileInfo {
    name: String;
    size: Number;
    lastWrited: Date;
    isDirectory: Boolean;
}

/**WhatIs 插件plugin处理结果 */
declare interface IWhatIsPluginResult {
    continue: boolean;
    mimeType?: string;
    /**是否可下载 */
    canDownload?: boolean;
    /**下载用的扩展名 */
    extension?: string;
    /**结果类型：text/html/none/<null> */
    resultType?: string;
    /**简要说明 */
    message: string;
    /**更多附加属性 */
    property?: object;
    /**PlugIn Name */
    name?: string;
    /**处理后的结果（比如格式化或解码），将替换默认默认 */
    result?: string | HTMLAnchorElement;

}

/**Whatis的插件*/
declare interface IWhatIsItPlgin {
    /**插件名称 */
    name: string;
    /**签名标识 */
    flag: number;
    /**flag标识长度 */
    bits: number;
    /** text/stream ,默认为：strem */
    mode?: string;
    /**插件代码 
     * @returns{IWhatIsPluginResult}*/
    function(stm: MemoryStream | string): IWhatIsPluginResult;
    //function: WhatIsPlugFunction;
}
declare interface IWhatIsItFormatResult {
    /**显示在文本框中的内 */
    text: string;
    /**用于html显示的内容 */
    htmlResult: JQuery<HTMLDivElement>;
    /**内容是否已经被格式化 */
    formatted: boolean;
}