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
itIs.push(<IWhatIsItPlgin>{
    "flag": 0x504B0304, bits: 32, name: "Zip",
    function(stm: MemoryStream) {
        if (!this.getZipInfo(stm)) return null;
        var files = this.getCdInfo(stm);
        var info = { "Encrypted": this.isEncrypted, "Files": files.length, "Total Size": 0 };
        var txt = "Zip Data Incluce:\n".concat(new Array(18).join("-"),"\n");
        var total = 0;
        for (var i = 0; i < files.length; i++) {
            const file = files[i];
            total += file.size;
            txt = txt.concat(Shotgun.Js.Library.byteSize(file.size), "Byte\t", file.name, "\n");
        }
        info["Total Size"] = total;
        return { property: info, message: "Zip-based or zip file", resultType: "text", result: txt, continue: false, canDownload: true, extension: "zip" };
    },
    convertZipDate(zipDate: number, zipTime: number): Date {
        var d: Date = new Date();
        if (zipDate == 0) return d;
        var val = zipTime;
        d.setSeconds((val & 0x01f) << 2);
        val >>= 5, d.setMinutes(val & 0x3f);
        val >>= 6, d.setHours(val);
        val = zipDate;
        d.setDate(val & 0x1f);
        val >>= 5, d.setMonth(val & 0x0f - 1);
        val >>= 4, d.setFullYear(val + 1980);
        return d;
    }
    , getZipInfo(stm: MemoryStream) {
        //End of central directory record
        const flag: Number = 0x06054b50;
        var f: number;
        stm.seek(-22, 2);
        var epX = stm.position - 0x10022;
        if (epX < 0) epX = 64;
        do {
            f = stm.readUInt32();
            if (f == flag) break;
            stm.seek(-5, 0);
        } while (stm.position > epX);
        if (stm.position <= 32) return false;
        stm.seek(6, 0);
        this.numOfCd = stm.readUInt16();
        var sizeOfCd = stm.readUInt32();
        this.posOfCd = stm.readUInt32();
        if (sizeOfCd + this.posOfCd > stm.getLength()) {
            console.warn("sizeOfCd+this.posOfCd>stm.getLength()");
            return false;
        }
        var sizeOfComment = stm.readUInt16();
        if (sizeOfComment > 0) {
            if (sizeOfComment + stm.position > stm.getLength())
                return false;
            this.zipComment = Shotgun.Js.Charsets.fromGB2312Bytes(stm.readBytes(sizeOfComment));
        }
        return this.numOfCd > 0 && this.posOfCd > 0;

    },
    getCdInfo(stm: MemoryStream): IFileInfo[] {
        stm.seek(this.posOfCd, 1);
        const flag: number = 0x02014b50;
        var files = new Array<IFileInfo>();
        for (var i = 0; i < this.numOfCd; i++) {
            var val: number = stm.readUInt32();
            if (val != flag) return null;
            stm.seek(4, 0);
            val = stm.readUInt16(); //Flags
            if (val & 0x01)
                this.isEncrypted = true;
            else if (val & 0x40)
                this.isEncrypted = true;//strong encryption;
            var file: IFileInfo = <IFileInfo>new Object();
            stm.seek(2, 0);
            var time = stm.readUInt16();
            val = stm.readUInt16();
            file.lastWrited = this.convertZipDate(val, time);
            stm.seek(8, 0);//skip crc , Compressed size;
            file.size = stm.readUInt32();
            val = stm.readUInt16();
            var nSize = stm.readUInt16();//Extra field length (m)
            nSize += stm.readUInt16();//File comment length (k)
            stm.seek(2 + 2 + 4 + 4, 0);//Disk number where file starts,Internal file attributes,External file attributes,relative offset of local header
            var bin = stm.readBytes(val)
            file.name = Shotgun.Js.Charsets.fromGB2312Bytes(bin);
            files.push(file);
            stm.seek(nSize, 0);//偏移扩展信息
            //console.log(JSON.stringify(file));
        }
        return files;
    },
    zipComment: null,
    numOfCd: 0,
    posOfCd: 0,
    isEncrypted: false
});