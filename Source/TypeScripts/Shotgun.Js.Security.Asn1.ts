namespace Shotgun.Js.Security {
    declare var oids: object;

    export class ASN1 {

        public static getChild(asn: IASN1Object, indexs: Array<number>): IASN1Object {

            for (var i = 0; i < indexs.length; i++) {
                const idx = indexs[i];
                if (!Array.isArray(asn.value))
                    return null;
                var nodes = <Array<IASN1Object>>asn.value;
                if (idx > nodes.length) return null;
                asn = nodes[idx];
            }
            return asn;
        }

        private _stm: MemoryStream;
        public static debugMode: boolean = false;

        public static toStruct(asn: IASN1Object): any {
            if (asn == null) return;
            var endiaNode = asn.value == void 0;
            endiaNode = endiaNode || (!Array.isArray(asn.value));
            endiaNode = endiaNode || (<Array<IASN1Object>>asn.value).length == 0;
            var tagName = String.format("x{0}", asn.type.toString(16));
            if (endiaNode) {
                if (asn.type != ASN1Type.OBJECT_IDENTIFIER)
                    return String.format("<{0}/>", tagName);
                return String.format("<{0}>{1}</{0}>", tagName, asn.value);
            }
            var childs = <Array<IASN1Object>>asn.value;
            if (childs == null) return;
            var rlts: string[] = [String.format("<{0}>", tagName)];
            for (var idx = 0; idx < childs.length; idx++) {
                rlts.push(this.toStruct(childs[idx]));
            }
            rlts.push(String.format("</{0}>", tagName));
            return rlts.join("");
        }

        public static parse(stm: MemoryStream): IASN1Object {
            var asn = new ASN1();
            asn._stm = stm;
            stm.bigEndian = true;
            var obj = asn.readObject();
            //asn.appendIdx(obj, "#");
            return obj;
        }

        /**读取一个ASN对象
         * @param endPoint 结束位置 */
        private readObject(endPoint: number = 0x7fffff): IASN1Object {

            var asn = <IASN1Object>{};
            //asn.index = "";
            asn.nodeOffset = this._stm.position;
            asn.sign = this._stm.readByte();
            asn.class = asn.sign >> 6;
            asn.isConstructed = ((asn.sign & 0x20) !== 0);
            asn.type = asn.sign & 0x1f;
            asn.isEoc = (asn.type & 0xDF) == 0;//class=0 && type=0 即去掉 0x20位后为0
            //asn.typeName = ASN1Type[asn.type];

            this.readLength(asn);

            asn.offset = this._stm.position;
            if (ASN1.debugMode) {
                if (asn.isChunked)
                    console.warn(String.format("nodeOffset:{0},length:{1},tagName:{2}({3}),chunked:{4},sign:{5}",
                        asn.nodeOffset, asn.dataLength, asn.type, ASN1Type[asn.type], !!asn.isChunked, asn.sign.toString(16)));
                else
                    console.log(String.format("nodeOffset:{0},length:{1},tagName:{2}({3}),chunked:{4},sign:{5}",
                        asn.nodeOffset, asn.dataLength, asn.type, ASN1Type[asn.type], !!asn.isChunked, asn.sign.toString(16)));
            }
            if (isNaN(asn.dataLength)) return null;
            if (asn.offset + asn.dataLength > endPoint) return null;//节点溢出
            // if(asn.dataLength==853)
            //     debugger;

            if (!this.isConstructed(asn))
                return this.readValue(asn);
            //字符模式，属于嵌套解码
            var isStringMode = asn.type == ASN1Type.BIT_STRING || asn.type == ASN1Type.OCTET_STRING;
            var arr = asn.value = new Array<IASN1Object>();
            var endoff = asn.offset + asn.dataLength;
            var lenSub = this._stm.getLength() - endoff;
            if (lenSub == -1 && asn.type == ASN1Type.BIT_STRING)
                endoff--, lenSub = 0;

            if (lenSub < 0) {
                if (isStringMode) {
                    this._stm.position = asn.offset;//BIT_STRING OCTET_STRING 数据非asn.1对象
                    return this.readValue(asn);
                }
                //console.log(String.format("越界？"));
                return null;
            }
            var idx = 0;
            var child: IASN1Object;

            while (this._stm.position < endoff) {
                try {
                    child = this.readObject(endoff);
                } catch (e) {
                    console.warn(e);
                    child = null;
                }
                if (child == null || (isStringMode && child.isEoc)) {
                    if (isStringMode) {
                        this._stm.position = asn.offset;//BIT_STRING OCTET_STRING 数据非asn.1对象
                        return this.readValue(asn);
                    }
                    return null;
                }
                if (asn.isChunked && child.sign == 0x00) {
                    asn.dataLength = this._stm.position - asn.offset;
                    if (asn.dataLength == 853)
                        debugger;
                    break;
                }
                arr.push(child);
            }

            return asn;
        }

        private isConstructed(asn: IASN1Object): boolean {
            if (asn.isConstructed || asn.type == ASN1Type.SEQUENCE || asn.type == ASN1Type.SET)
                return true;

            if (asn.class == 0) {//isUniversal

                // BIT_STRING OCTET_STRING 可能存储的也是asn.1
                if (asn.type == ASN1Type.OCTET_STRING)
                    return true;
                if (asn.type == ASN1Type.BIT_STRING) {
                    //检测存储在BIT_STRING 中的asn1对象
                    var z = this._stm.readByte();
                    if (z != 0) {
                        this._stm.seek(-1, 0);
                        return false;
                    }
                    return true;
                }

            }
            return false;
        }
        /**读取对象值，返回对像即传入值 */
        private readValue(asn: IASN1Object): IASN1Object {
            if (asn.class != 0) {
                this.readString(asn, Encoder.Unknow);
                return asn;
            }
            switch (asn.type) {
                case ASN1Type.BOOLEAN: asn.value = this._stm.readByte() != 0; break;
                case ASN1Type.INTEGER: this.readInteger(asn); break;
                case ASN1Type.UTC_TIME:
                case ASN1Type.GeneralizedTime: this.readTime(asn); break;
                case ASN1Type.PRINTABLE_STRING:
                case ASN1Type.IA5_STRING:
                case ASN1Type.UTF8_STRING: this.readString(asn); break;
                case ASN1Type.EOC:
                case ASN1Type.OCTET_STRING: //this.readHexstring(asn); break;
                case ASN1Type.BIT_STRING: this.readHexstring(asn); break;
                case ASN1Type.OBJECT_IDENTIFIER: this.readOId(asn); break;
                // case ASN1Type.SEQUENCE:
                // case ASN1Type.SET:
                case ASN1Type.NULL: this._stm.seek(asn.dataLength, 0); break;
                case ASN1Type.REAL:
                default:
                    this.readHexstring(asn);
                    asn.inComplete = true;
                    break;
            }
            return asn;
        }
        private readTime(asn: IASN1Object): void {
            this.readString(asn);
            var s = <string>asn.value;

            var shortYear = asn.type == ASN1Type.UTC_TIME;
            var reTimeL = /(\d\d)(\d{2})(\d{2})(\d{2})(?:(\d{2})(?:(\d{2})(?:[.,](\d{1,3}))?)?)?(Z|[-+](?:[0]\d|1[0-2])([0-5]\d)?)?$/;

            var m = reTimeL.exec(s);
            if (!m) return;
            var year = +m[1];
            if (shortYear)
                year += (year < 70) ? 2000 : 1900;
            else
                year += parseInt(s.substring(0, 2)) * 100;

            s = String.format("{0}-{1}-{2} {3}", year, m[2], m[3], m[4]);
            if (m[5]) {
                s += ":" + m[5];
                if (m[6]) {
                    s += ":" + m[6];
                    if (m[7]) s += "." + m[7];
                }
            }
            if (m[8]) {
                s += " UTC";
                if (m[8] != 'Z') {
                    s += m[8];
                    if (m[9]) s += ":" + m[9];
                }
            }
            var dt = new Date(s);
            if (isNaN(dt.getTime())) return;
            asn.value = dt.toLocaleString();
        }
        private readOId(asn: IASN1Object): void {
            var bin = this._stm.readBytes(asn.dataLength);
            var s = String.format("{0}.{1}", (bin[0] / 40).toFixed(), bin[0] % 40);

            var t = 0;
            for (var i = 1; i < bin.length; i++) {
                const v = bin[i];
                if (v < 0x80) {
                    s = s.concat(".", (t | v).toString());
                    t = 0;
                    continue;
                }
                t |= (v & 0x7f)
                t <<= 7;
            }
            asn.value = s;
        }
        private readHexstring(asn: IASN1Object): void {
            var bin = this._stm.readBytes(asn.dataLength);
            asn.isHexVaule = true;
            asn.value = bytesToHex(bin, { withAscii: false, spliter: "", width: -1, noHead: true }).replace(/ /g, "");
        }

        private readString(asn: IASN1Object, encode: Encoder = Encoder.Utf8): void {
            var bin = this._stm.readBytes(asn.dataLength);
            if (encode == Encoder.Unknow)
                encode = Shotgun.Js.Charsets.detection(bin);
            if (encode == Encoder.Unknow) {
                asn.isHexVaule = true;
                asn.value = bytesToHex(bin, { withAscii: false, spliter: "", width: -1, noHead: true }).replace(/ /g, "");
                return;
            }
            asn.value = Shotgun.Js.Charsets.bytesToString(bin, encode);
        }
        private readLength(asn: IASN1Object): IASN1Object {
            var t = this._stm.readByte();
            if ((t & 0x80) == 0) {
                asn.dataLength = t;
                return asn;
            }

            t &= 0x7f;
            asn.isChunked = false;
            switch (t) {
                case 1: asn.dataLength = this._stm.readByte(); break;
                case 2: asn.dataLength = this._stm.readUInt16(); break;
                case 3: asn.dataLength = this._stm.readUInt16() << 8 | this._stm.readByte(); break;
                case 4: asn.dataLength = this._stm.readUInt32(); break;
                case 0:
                    asn.isChunked = true;
                    asn.dataLength = this._stm.getLength() - this._stm.position; break;
                default: asn.dataLength = NaN;
            }
            return asn;
        }
        private readInteger(asn: IASN1Object) {
            switch (asn.dataLength) {
                case 1: asn.value = this._stm.readByte(); break;
                case 2: asn.value = this._stm.readUInt16(); break;
                case 3: asn.value = this._stm.readUInt16() << 8 | this._stm.readByte(); break;
                case 4: asn.value = this._stm.readUInt32(); break;
                default: this.readHexstring(asn); break;
            }
        }
        public static toXmlString(asn: IASN1Object, tab = 0): string {
            var tabStr = new Array(tab + 1).join(" ");
            if (asn == null) return;
            var endiaNode = typeof asn.value == "undefined";
            endiaNode = endiaNode || (!Array.isArray(asn.value));
            endiaNode = endiaNode || (<Array<IASN1Object>>asn.value).length == 0;
            var oidInfo: IASN1OID = null;
            if (asn.class == 0 && asn.type == ASN1Type.OBJECT_IDENTIFIER) {
                if (typeof Asn1Oid != "undefined")
                    oidInfo = Asn1Oid.getInfo(<string>asn.value);
                //if (this.debugMode) {
                //    if (oidInfo != null)
                //        console.log("oid", asn.value, oidInfo["c"], oidInfo["d"]);
                //    else
                //        console.log("oid", asn.value);
                //}
            }
            var pros = new Array<string>();
            var tagName: string;
            if (asn.class != 0) {
                tagName = "NODE";
                pros.push(tagName);
                pros.push(String.format("Sign=\"{0}\"", (asn.sign).toString(16)));
            }
            else {
                tagName = ASN1Type[asn.type];
                if (tagName == void 0 || String.isNullOrEmpty(tagName)) {
                    tagName = "UNKNOW";
                    pros.push(String.format("Sign=\"{0}\"", (asn.sign).toString(16)));
                }
                else
                    pros.push(tagName);
            }
            if (this.debugMode) {
                pros.push(String.format("Offset=\"\{0}\"", asn.nodeOffset));
                pros.push(String.format("Length=\"{0}\"", asn.nodeOffset));
            }


            if (oidInfo != null) {
                pros.push(String.format("Comment=\"{0}\"", oidInfo.comment));
                pros.push(String.format("Description=\"{0}\"", oidInfo.description));
            }

            if (endiaNode) {
                if (!asn.value)
                    return String.format("{0}<{1}/>", tabStr, tagName, pros);
                if (asn.inComplete) pros.push("Incomplete=\"true\"");
                return String.format("{0}<{1}>{2}{3}</{4}>", tabStr, pros.join(" "), (asn.isHexVaule ? "0x" : null), asn.value, tagName);
            }


            var childs = <Array<IASN1Object>>asn.value;
            if (childs == null) return;
            var rlts: string[] = [String.format("{0}<{1}>", tabStr, pros.join(" "))];
            for (var idx = 0; idx < childs.length; idx++) {
                rlts.push(this.toXmlString(childs[idx], tab + 1));
            }
            rlts.push(String.format("{0}</{1}>", tabStr, tagName));
            return rlts.join("\n");
        }
    }
}