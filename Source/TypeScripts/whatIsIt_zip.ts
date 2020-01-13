declare var itIs: IWhatIsItPlgin[];

itIs.push({
    "flag": 0x1F8B08, "bits": 24, "name": "Gzip", "mode": "stream",
    function(stm: MemoryStream) {
        //https://blog.csdn.net/jison_r_wang/article/details/52068607
        if (stm.getLength() < 16) return null;
        var f = stm.readByte();
        if ((f & 0xE0) !== 0) //Bit 5~7   预留，必须全0
            return null;
        //stm.bigEndian = true;
        var unixTime = stm.readUInt32();

        var xf = stm.readByte();//eXtraFLags 2/4
        if (xf !== 2 && xf !== 4 && xf !== 0)
            return null;

        var rlt: IWhatIsPluginResult = {
            continue: false, mimeType: "application/x-gzip", message: "Gzip compressed data",
            extension: "z",
            canDownload: true,
            property: { "eXtraFLags": xf }
        };
        if (unixTime !== 0)
            rlt.property["SystemTime"] = new Date(unixTime * 1000).toLocaleString();
        var os = stm.readByte();
        if (os > 14)
            rlt.property["OperatingSystem"] = os + "-Unknow";
        else
            rlt.property["OperatingSystem"] = ["0-FAT filesystem(MS-DOS,OS/2,NT/Win32)", "1-Amiga", "2-VMS(orOpenVMS)", "3-Unix"
                , "4-VM/CMS", "5-Atari TOS", "6-HPFS filesystem(OS/2,NT)", "7-Macintosh",
                "8-Z-System", "9-CP/M", "10-TOPS-20", "11-NTFS filesystem(NT)",
                "12-QDOS", "13-Acorn RISCOS", "14-VFAT file system (Win95, NT)", "15-MVS or PRIMOS",
                "16-BeOS", "17-Tandem/NSK", "18-THEOS", "19-macOS,,OS/X,iOS or watchOS"][os];
        return rlt;
    }
});
itIs.push({
    "flag": 0x504B0304, bits: 32, name: "Zip",
    function(stm: MemoryStream) {
        stm.bigEndian = false;
        //var err: number = 0;
        var info = new Object();
        var val = stm.readUInt16();
        info["Version"] = (val / 10).toFixed(1);
        info["First File"] = null;
        val = stm.readUInt16(); //Flags
        if (val & 0x01)
            info["Encrypted"] = true;
        if (val & 0x40)
            info["Encrypted"] = "strong encryption";
        var gBit3: boolean = (val & 0x04) != 0;

        val = stm.readUInt16();
        if (val < 9)
            info["Compression"] = ["0-Stored (no compression)", "1-Shrunk", "2-Reduced with compression factor 1",
                "3-Reduced with compression factor 2", "4-Reduced with compression factor 3",
                "5-Reduced with compression factor 4", "6-Imploded", "7-Reserved for Tokenizing compression algorithm",
                "8-Deflated"][val];

        val = stm.readUInt16();

        if (val > 0) {
            var d: Date = new Date();
            d.setSeconds((val & 0x01f) << 2);
            val >>= 5, d.setMinutes(val & 0x3f);
            val >>= 6, d.setHours(val);
            val = stm.readUInt16();
            d.setDate(val & 0x1f);
            val >>= 5, d.setMonth(val & 0x0f - 1);
            val >>= 4, d.setFullYear(val + 1980);
            info["Last Modified"] = d.toLocaleString();
        }
        if (gBit3)
            stm.seek(12, 0);//The correct values are put in the data descriptor immediately following the compressed data.
        else {
            val = stm.readUInt32();
            if (val != 0)
                info["CRC32"] = "0x".concat(val.toString(16));

            var pSize = stm.readUInt32();
            if (pSize !== 0xffffffff && pSize > 0) {
                info["Package Size"] = pSize.toString();
                if (stm.getLength() < pSize)
                    return null;
            }
            val = stm.readUInt32();
            if (val !== 0xffffffff && val > 0)
                info["File Size"] = val.toString();
        }
        pSize = stm.readUInt16();
        var efl: number = stm.readUInt16();
        var fName = stm.readBytes(pSize);
        if (pSize == 0)
            delete info["First File"];
        else
            info["First File"] = Shotgun.Js.Charsets.fromGB2312Bytes(fName);
        //stm.seek(efl,0);

        return { property: info, message: "Zip Format file", continue: false, canDownload: true, extension: "zip" };
    }
});