itIs.push(<IWhatIsItPlgin>{
    flag: 0x25504446, bits: 32, name: "Adobe PDF",
    function(stm: MemoryStream) {
        if (stm.readByte() != 0x2d) return null;
        stm.seek(-7, 2);
        var str = stm.readLine();
        if (str != "%%EOF") return null;
        stm.seek(5, 1);
        var ver = parseFloat(stm.readLine());
        if (isNaN(ver)) return null;        
        return { continue:false,canDownload:true,extension:"pdf", property:{"Version":ver} };
    }
})