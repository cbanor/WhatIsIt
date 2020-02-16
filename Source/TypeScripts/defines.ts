
/**WhatIs识别结果 */
interface IWhatIsItResult {
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
interface IFileInfo {
    name: String;
    size: Number;
    lastWrited: Date;
    isDirectory: Boolean;
}

/**WhatIs 插件plugin处理结果 */
interface IWhatIsPluginResult {
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
interface IWhatIsItPlgin {
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
interface IWhatIsItFormatResult {
    /**显示在文本框中的内 */
    text: string;
    /**用于html显示的内容 */
    htmlResult: JQuery<HTMLDivElement>;
    /**内容是否已经被格式化 */
    formatted: boolean;
}


// /**针对Shotgun.Js.Charsets的TS定义 */
// declare class jsChareset {
//     Charsets: {
//         isAscii(stm: Uint8Array): boolean,
//         isUtf8(stm: Uint8Array): boolean,
//         getGBxName(stm: Uint8Array): string,
//         isUnicode(stm: Uint8Array): boolean,
//         fromUtf8Bytes(bin: Uint8Array): string,
//         fromUnicodeBytes(bin: Uint8Array): string,
//         fromGB2312Bytes(bin: Uint8Array): string,
//         toUtf8Bytes(str: string): Uint8Array,
//         bytesToString(bin: Uint8Array, ecncode: Encoder): string
//     }
//     Base64: { decode(b64str: string): Uint8Array };
//     //Library: ILibrary;
// }

/**针对Shotgun.Js的TS定义 */
// declare class Shotgun {
//     static Js: jsChareset
// }

declare function checkBase64(str: string): number;
declare function checkHex(str: string): number;
declare function Toast(msg: string, delay?: number, cssName?: string): object;

interface IHexFormatOptions { withAscii?: boolean, noHead?: boolean, width?: number };
declare function bytesToHex(bin: Uint8Array, options?: IHexFormatOptions): string;

//declare function hexFormat(bin: Uint8Array, width?: number): string;