/**字符编码定义*/
enum Encoder {
    Utf8 = 0,
    Unicode = 1,
    Gb2312 = 2,
    Gbk = 3,
    Ascii = 4,
    Base64 = 0x100,
    Hex = 0x101,
    Unknow = 0xffffFFff
}

// class WhatIsPluginResult {
//     static toString(result: IWhatIsPluginResult): string {
//         var txt = "插件名：【".concat(result.name).concat("】,").concat(result.message).concat("【").concat(result.continue ? "疑似" : "确认").concat("】");

//         if (result.mimeType)
//             txt += "\nmimeType:".concat(result.mimeType);
//         if (!result.property)
//             return txt;

//         txt += "\n附加信息：";
//         for (var k in result.property) {
//             txt = txt.concat("\n\t").concat(k).concat(":").concat(result.property[k]);
//         }
//         return txt;
//     }
// }


 