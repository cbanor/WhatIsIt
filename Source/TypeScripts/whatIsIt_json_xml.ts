itIs.push({
    bits: 0, flag: 0, name: "JSON", mode: "text", function(str: string) {
        if (typeof JSON == "undefined") return null;
        var i = 0, e = 0;
        var f: String = null;
        for (; i < str.length; i++) {
            var c = str.charAt(i);
            switch (c) {
                case '\n': case "\r": case "\t": case " ": continue;
                case '[': case '{': f = String.fromCharCode(c.charCodeAt(0) + 2); break;
                default: return null;//非法json 开始字符
            }
            break;
        }
        if (f == null) return null;
        i++;
        for (e = str.length - 1; e > i; e--) {
            var c = str.charAt(e);
            switch (c) {
                case '\n': case "\r": case "\t": case " ": continue;
                case ']': case '}':
                    if (c == f) break;
                default: return null;//非法json结束字符
            }
            break;
        }
        var jObj: any = null;
        try {
            jObj = JSON.parse(str);
        } catch (e) {
            console.warn("Not Json Result", e);
            return null;
        }

        return { message: "", result: JSON.stringify(jObj, null, 2), resultType: "text", continue: false };
    }

});
itIs.push({
    bits: 0, flag: 0, name: "XML", mode: "text", function(xStr: string) {
        if (typeof DOMParser == "undefined" || typeof XMLSerializer == "undefined") return null;
        if (xStr.length < 10) return null;
        var i: number = 0, nsIdx = -1;
        for (; i < xStr.length; i++) {
            var c = xStr.charAt(i);
            switch (c) {
                case '\n': case "\r": case "\t": case " ": continue;
                case '<': break;
                default: return null;//非法XML 开始字符
            }
            break;
        }
        if (xStr.charAt(i + 1) == "?") nsIdx = i;
        for (var e = xStr.length - 1; e > i; e--) {
            var c = xStr.charAt(e);
            switch (c) {
                case '\n': case "\r": case "\t": case " ": continue;
                case '>': break;
                default: return null;//非法XML 结束字符
            }
            break;
        }
        var d = new DOMParser();
        var xml: XMLDocument = null;
        try {
            xml = d.parseFromString(xStr, "text/xml");
        } catch (e) {
            console.warn("Not Xml Result", e);
            return null;
        }
        if (xml == null) return null;

        var els = xml.getElementsByTagName("parsererror");
        if (els.length == 1) {
            var el = els[0];
            if (el.hasAttribute("style")) {
                console.warn("xml error", $(els[0]).text());
                return null;
            }

            var l = xStr.lastIndexOf("</");
            if (l == -1) {
                console.warn("xml error", $(els[0]).text());
                return null;
            }

            var tName = /(\w.+?)(>|\s)/.exec(xStr.substr(l))[1];
            if (xml.firstChild.nodeName != tName) {
                console.warn("xml error", $(els[0]).text());
                return null;
            }
        }

        function attrToStr(node: Element): string {
            var ret: string[] = new Array<string>();
            var attrs: NamedNodeMap = node.attributes;
            for (let index = 0; index < attrs.length; index++) {
                const attr = attrs[index];
                ret.push(attr.name.concat("=\"", encode(attr.value), "\""));
            }
            return ret.join(' ');
        }
        function encode(value: string): string {
            if (String.isNullOrEmpty(value)) return value;
            var ret: string[] = new Array<string>();
            for (var i = 0; i < value.length; i++) {
                const c = value.charAt(i);
                switch (c) {
                    case "<": ret.push("&lt;"); break;
                    case ">": ret.push("&gt;"); break;
                    case "\"": ret.push("&quot;"); break;
                    case "'": ret.push("&apos;"); break;
                    case "&": ret.push("&amp;"); break;
                    default: ret.push(c); break;
                }
            }
            return ret.join("");

        }
        function nodeToStr(node: Element, dept: number, cnt: string[]): void {
            if (node.nodeType == 3) return;//#text ??
            if (node.nodeType == 4) { //CDATA IE?!
                cnt.push("<![CDATA[".concat(node.firstChild.nodeValue, "]]>"));
                return;
            }
            var tab: string = (new Array<string>(dept * 2 + 1)).join(" ");
            if (node.nodeType == 8) {//注释
                cnt.push(tab.concat("<!--", node.nodeValue, "-->"));
                return;
            }
            if (node.nodeType == 10) {
                var attr = [];
                var dType = <DocumentType><any>node;
                if (!String.isNullOrEmpty(dType.name))
                    attr.push(dType.name);
                if (!String.isNullOrEmpty(dType.publicId))
                    attr.push("PUBLIC \"".concat(dType.publicId, "\""));

                if (!String.isNullOrEmpty(dType.systemId))
                    attr.push("\"".concat(dType.systemId, "\""));

                if (attr.length == 0)
                    cnt.push("<!DOCTYPE>");
                else
                    cnt.push("<!DOCTYPE ".concat(attr.join(" "), ">"));
                nodeToStr(<Element>node.nextSibling, dept, cnt);
                return;
            }
            var name = node.nodeName;// node.nodeType==1;//Element
            var s = "<".concat(name);
            if (node.hasAttributes()) {
                s += " ".concat(attrToStr(node));
            }

            if (!node.hasChildNodes()) {
                cnt.push(tab.concat(s, "/>"))
                return;
            }

            if (node.firstChild.nodeType == 3 && node.childNodes.length == 1)//#text
            {
                cnt.push(tab.concat(s, ">", encode(node.firstChild.nodeValue), "</", name, ">"));
                return;
            }
            if (node.firstChild.nodeType == 4)//#CDATA
            {
                cnt.push(tab.concat(s, "><![CDATA[", node.firstChild.nodeValue, "]]></", name, ">"));
                return;
            }

            //普通ElementNode
            cnt.push(tab.concat(s, ">"));
            for (let index = 0; index < node.childNodes.length; index++) {
                const element = node.childNodes[index];
                nodeToStr(<Element>element, dept + 1, cnt);
            }
            cnt.push(tab.concat("</", name, ">"));
        }


        var rlt = new Array<string>();

        if (nsIdx != -1) {
            i = xStr.indexOf("?>", nsIdx);
            rlt.push(xStr.substring(nsIdx, i + 2));
        }
        nodeToStr(<Element>xml.firstChild, 0, rlt);
        return { message: "", continue: false, result: rlt.join("\n"), resultType: "text" };
    }
});