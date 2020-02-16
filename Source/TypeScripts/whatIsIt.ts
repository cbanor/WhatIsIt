var itIs = new Array<IWhatIsItPlgin>();

class WhatIsIt {
    /**数据识别耗时（ms）*/
    static elapsed: number;
    /**
     * 识别数据内容
     * @param bin
     * @returns  
     */
    static itIs(bin: Uint8Array): IWhatIsItResult {
        var dt: number = new Date().getTime();

        var charset = this.getChatSet(bin);

        var pr: IWhatIsPluginResult[] = null;
        if (itIs && itIs.length > 0) {
            pr = this.checkByPlugin(bin, charset);
        }
        WhatIsIt.elapsed = (new Date().getTime() - dt)
        return { isSuccess: (charset != Encoder.Unknow || pr != null), message: "ok", chartSet: charset, results: pr };
    }
    private static checkByPlugin(bin: Uint8Array, chareset: Encoder): IWhatIsPluginResult[] {
        var stm = new MemoryStream(bin);
        var ed = stm.bigEndian;
        stm.bigEndian = true;
        var maxBits = stm.getLength() > 4 ? 32 : stm.getLength() * 8;
        var f32: number;
        switch (maxBits) {
            case 32: f32 = stm.readUInt32(); break;
            case 16: f32 = stm.readUInt16(); break;
            case 8: f32 = stm.readByte(); break;
            default: return null;
        }
        var isBinary = chareset == Encoder.Unknow || chareset == Encoder.Unicode;
        var isText = chareset != Encoder.Unknow;


        let txt: string = null;
        let results: Array<IWhatIsPluginResult> = new Array<IWhatIsPluginResult>();
        for (var i = 0; i < itIs.length; i++) {
            var plugIn = itIs[i];
            switch (plugIn.mode) {
                case "text":
                    if (!isText) continue;
                    if (txt == null) txt = Shotgun.Js.Charsets.bytesToString(bin, chareset);
                    break;
                case "fixedLength": if (bin.length != plugIn.flag) continue; break;
                default:
                    if (!isBinary) continue; // 非文本插件，无法处理文本内容
                    if (plugIn.bits > maxBits) continue;
                    var flag = f32 >>> (32 - plugIn.bits);
                    if (flag ^ plugIn.flag) //签名不一致
                        continue;
                    stm.bigEndian = ed;
                    stm.seek(plugIn.bits / 8, 1);
                    break;
            }


            let rlt: IWhatIsPluginResult = null;
            try {
                rlt = plugIn.function((plugIn.mode == "text") ? txt : stm);
            } catch (ex) {
                console.error("WhatIsPlugin", plugIn.name, ex);
                continue;
            }
            if (rlt === null)
                continue;
            if (!rlt.name)
                rlt.name = plugIn.name;
            results.push(rlt);
            if (!rlt.continue)
                break;
        }
        return results.length > 0 ? results : null;
    }

    /**
     * 获取字符串编码信息
     * @param {UInt8Array} bin 信息体
     * @returns {Encoder} {msg:"xxx",charset:"xxx"}
     */
    static getChatSet(bin: Uint8Array): Encoder {

        if (!Shotgun && Shotgun.Js && Shotgun.Js.Charsets) {
            throw { message: "未加载 Shotgun.Js.Charsets" };
        }

        if (bin.indexOf(0) === -1) {
            if (Shotgun.Js.Charsets.isAscii(bin))
                return Encoder.Ascii;
            if (Shotgun.Js.Charsets.isUtf8(bin))
                return Encoder.Utf8;
            var gbX = Shotgun.Js.Charsets.getGBxName(bin);
            if (gbX == "GB2312") return Encoder.Gb2312;
        }
        if (Shotgun.Js.Charsets.isUnicode(bin))
            return Encoder.Unicode;
        return Encoder.Unknow;
    };
    /**获取插件数 */
    public static getPluginCount(): number {
        return itIs ? itIs.length : 0;
    }
    public static formatResult(rlt: IWhatIsItResult, bin: Uint8Array): IWhatIsItFormatResult {

        var ret: IWhatIsItFormatResult = { text: "", htmlResult: $("<div></div>"), formatted: false };

        var encoder = Encoder.Unknow;
        var iSuccess = (rlt && rlt.isSuccess);
        if (!iSuccess) {//?????
            ret.htmlResult.append("<div class='unknow'>未能识别的数据</div>");
        }
        else {
            encoder = rlt.chartSet;
            if (rlt.results && rlt.results.length != 0) {
                for (var i = 0; i < rlt.results.length; i++) {
                    var r = rlt.results[i];

                    var div = $("<div class='pluginResult'></div>");
                    ret.htmlResult.append(div);
                    div.append("插件名：【".concat(r.name, "】", r.message, r.continue ? "【疑似】" : ""));

                    if (r.canDownload) {
                        var lnk = this.createUrl(bin, r);
                        if (lnk != null) {
                            var pv = $("<div>另存为：</div>");
                            pv.append(lnk);
                            ret.htmlResult.append(pv);
                        }
                    }
                    if (!r.resultType || r.resultType == "none") { }
                    else if (r.resultType == "html") {
                        var pv = $("<div>识别结果：</div>");
                        pv.append($(<HTMLElement>r.result));
                        ret.htmlResult.append(pv);
                    }
                    else {
                        if (ret.text && !r.continue)
                            ret.text = <string>r.result;
                        else
                            ret.text = <string>r.result;
                    }
                    if (!r.property) continue;

                    var ps = new Array<String>();
                    for (var k in r.property)
                        ps.push(k.concat(":", r.property[k]));

                    if (ps.length == 0) continue;

                    div.append("<div>附加信息：</div>")
                    div.append($("<pre>".concat(ps.join("\n"), "</pre>")));
                }

            }
        }

        ret.formatted = !Shotgun.Js.Library.isNullOrEempty(ret.text);
        if (encoder == Encoder.Unknow) {
            if (!ret.formatted) {
                ret.htmlResult.append($("<div>当前编码：<em class='encoder'>【Hex".concat(iSuccess ? "" : "+Ascii", "】</em></div>")));
                ret.text = bytesToHex(bin, { withAscii: !iSuccess });
            }
        } else {
            ret.htmlResult.append($("<div>当前编码：<em class='encoder'>【".concat(Encoder[encoder], "】</em></div>")));
            if (!ret.formatted)
                ret.text = Shotgun.Js.Charsets.bytesToString(bin, encoder);
        }
        if (ret.formatted) {
            ret.htmlResult.append("<div class='formatted'>显示内容非原始信息 "
                .concat("<span title='插件对此内容进行了格式化、解码或其他调整，如需原始内容请使用非自动模式。'",
                    " class='glyphicon glyphicon-question-sign'></span></div>"));
        }


        ret.htmlResult.append("<div class='pluginInfo'>插件总数:<i>"
            .concat(WhatIsIt.getPluginCount().toString(), "</i>，识别耗时：<i>", WhatIsIt.elapsed.toString(), "</i>ms</div>"));
        return ret;
    }
    static createUrl(bin: Array<number> | Uint8Array, pResult: IWhatIsPluginResult): HTMLAnchorElement {
        var lnk = document.createElement("a");
        var t = pResult.extension ? pResult.extension : ".unknow";
        lnk.innerHTML = "<b>".concat(t, "文件");
        lnk.download = "from_base64@the-x.".concat(t);
        if (typeof Uint8Array == "undefined"
            || typeof URL == "undefined" || !URL.createObjectURL
            || typeof Blob == "undefined") {
            lnk.title = '请使用Chrome/Edge/IE10+浏览器';
            lnk.href = "javascript:void(alert('".concat(lnk.title, "'));");
            console.warn("Uint8Array / URL /Blob 不支持");
            return lnk;
        }
        var arr = new Uint8Array(bin);
        var mType = pResult.mimeType ? pResult.mimeType : "Application/octet-stream";
        var bob = new Blob([arr], { type: mType })
        if (!!window.navigator.msSaveOrOpenBlob) {
            $(lnk).on("click", function () { return window.navigator.msSaveOrOpenBlob(bob, lnk.download) && false; });
            lnk.href = "#";
        } else {
            var uri = URL.createObjectURL(bob);
            lnk.href = uri;
        }
        return lnk;
    }
}
