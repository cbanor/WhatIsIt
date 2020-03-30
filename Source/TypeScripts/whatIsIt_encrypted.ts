//53 61 6C 74
itIs.push({
    "flag": 0x53616C74, "bits": 32, "name": "Salted", "mode": "stream",
    function(stm: MemoryStream) {
        stm.bigEndian = true;
        var p2 = stm.readInt32();
        if (p2 != 0x65645F5F) return null;
        var len = stm.getLength() - 16;
        if (len < 0 || len % 8 != 0) return null;//简单长度校验
        var salte = bytesToHex(stm.readBytes(8), { noHead: true, withAscii: false, spliter: "", width: -1 });
        return { continue: false, message: "OpenSSL encrypted data", property: { "salte": salte }, canDownload: true, extension: "salted" };
    }
});
