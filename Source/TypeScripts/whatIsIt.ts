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

        var charset = Shotgun.Js.Charsets.detection(bin);

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
        var isBinary = chareset == Encoder.Unknow || chareset == Encoder.Utf16_LE || chareset == Encoder.Utf16_BE;
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


    /**获取插件数 */
    public static getPluginCount(): number {
        return itIs ? itIs.length : 0;
    }
    public static formatResult(rlt: IWhatIsItResult, bin: Uint8Array): IWhatIsItFormatResult {

        var ret: IWhatIsItFormatResult = { text: "", htmlResult: $("<div></div>"), formatted: false };

        var encoder = Encoder.Unknow;
        var iSuccess = (rlt && rlt.isSuccess);
        if (!iSuccess) {//?????
            ret.htmlResult.append("<div class='unknow'>".concat($Localizer.get("Unrecognized data"), "</div>"));
        }
        else {
            encoder = rlt.chartSet;
            if (rlt.results && rlt.results.length != 0) {
                for (var i = 0; i < rlt.results.length; i++) {
                    var r = rlt.results[i];

                    var div = $("<div class='pluginResult'></div>");
                    ret.htmlResult.append(div);
                    //div.append($Localizer.get("Plugin:[{0}]" "插件名：【".concat(r.name, "】", r.message, r.continue ? "【疑似】" : ""));
                    div.append($Localizer.get("Plug-in [{0}]{1} {2}", r.name, r.message, $Localizer.get(r.continue ? "(Maybe)" : null)));

                    if (r.canDownload) {
                        var lnk = this.createUrl(bin, r);
                        if (lnk != null) {
                            var pv = $("<div>".concat($Localizer.get("Save as"), " : </div>"));
                            pv.append(lnk);
                            ret.htmlResult.append(pv);
                        }
                        if (String.isNullOrEmpty(ret.text) && bin.length > 4096)
                            ret.text = $Localizer.get("The content has been recognized as binary by the plug-in.");
                    }
                    if (!r.resultType || r.resultType == "none") { }
                    else if (r.resultType == "html") {
                        var pv = $("<div>".concat($Localizer.get("Recognition result"), "：</div>"));
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

                    div.append("<div>".concat($Localizer.get("Additional information"), " :</div>"));
                    div.append($("<pre>".concat(ps.join("\n"), "</pre>")));
                }

            }
        }

        ret.formatted = !String.isNullOrEmpty(ret.text);
        if (encoder == Encoder.Unknow) {
            if (!ret.formatted) {
                ret.htmlResult.append($(String.format("<div>{0} : <em class='encoder'>[Hex{1}]</em></div>",
                    $Localizer.get("Current encoding"),
                    (iSuccess ? "" : " + Ascii"))));
                ret.text = bytesToHex(bin, { withAscii: !iSuccess });
            }
        } else {
            ret.htmlResult.append($(String.format("<div>{0} : <em class='encoder'>[{1}]</em></div>",
                $Localizer.get("Current encoding"), Encoder[encoder])));
            if (!ret.formatted)
                ret.text = Shotgun.Js.Charsets.bytesToString(bin, encoder);
        }

        if (ret.formatted) {// 插件对此内容进行了格式化、解码或其他调整，如需原始内容请使用非自动模式。'",
            ret.htmlResult.append(String.format("<div class='formatted'>{0}  <span title='{1}' class='glyphicon glyphicon-question-sign'></span></div>",
                $Localizer.get("Results content is not original information"),
                $Localizer.get("Using non-automatic mode for the original content.")));
        }

        ret.htmlResult.append(String.format("<div>{0} : <em>{1} Bytes</em></div>", $Localizer.get("Data size"), bin.length));
        ret.htmlResult.append("<div class='pluginInfo'>".concat($Localizer.get("Number of plug-ins"),
            " : <i>", WhatIsIt.getPluginCount().toString(), "</i>，",
            $Localizer.get("Elapsed"), " : <i>", WhatIsIt.elapsed.toString(), "</i>ms</div>"));
        return ret;
    }
    static createUrl(bin: Array<number> | Uint8Array, pResult: IWhatIsPluginResult): HTMLAnchorElement {
        var lnk = document.createElement("a");
        var t = pResult.extension ? pResult.extension : ".unknow";
        lnk.innerHTML = "<b>".concat($Localizer.get("{0} file", t));// "文件");
        lnk.download = "from_base64@the-x.".concat(t);
        if (typeof Uint8Array == "undefined"
            || typeof URL == "undefined" || !URL.createObjectURL
            || typeof Blob == "undefined") {
            lnk.title = $Localizer.get("Please use Chrome/Edge/IE10+");//  '请使用Chrome/Edge/IE10+浏览器';
            lnk.href = "javascript:void(alert('".concat(lnk.title, "'));");
            console.warn("Uint8Array / URL /Blob unsupport");
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
