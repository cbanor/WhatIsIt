itIs.push({
    bits: 0, flag: 0, name: "UrlEncoder", mode: "text", function(uStr: string) {
        var rx = /\%[a-f0-9]{1,2}/ig;
        var mc = rx.exec(uStr);
        if (mc == null) return null;
        do {
            if (mc[0].length != 3) return null;
        } while (mc = rx.exec(uStr));
        var lnk = document.createElement("a");
        lnk.innerHTML = "UrlDecode Tools";
        lnk.href = "/UrlDecode.aspx";
        lnk.target = "_blank";
        return { message: "Urlencode may have been used.", continue: true, resultType: "html", result: lnk };
    }
});