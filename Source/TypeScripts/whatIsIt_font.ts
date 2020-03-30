itIs.push({
    "flag": 0x00010000, "bits": 32, "name": "TTF",
    function(stm: MemoryStream) {
        //https://blog.csdn.net/ZH519080/article/details/75443795
        //https://www.disidu.com/post/15.html
        //https://developer.apple.com/fonts/TrueType-Reference-Manual/
        stm.bigEndian = true;
        stm.seek(4, 1);
        var numOfTables = stm.readUInt16();
        stm.seek(12, 1);
        var pos = 0, len = 0;
        for (var i = 0; i < numOfTables; i++) {
            if (stm.readInt32() == 0x6E616D65) {//name
                stm.seek(4, 0);//checkSum 
                pos = stm.readUInt32();
                len = stm.readUInt32();
                break;
            }
            stm.seek(12, 0);
        }
        if (pos == 0 || pos + len > stm.getLength()) return null;
        //console.log("name entry:", pos.toString(16));
        stm.seek(pos, 1);

        //name table
        var nameTable = { fSelector: stm.readUInt16(), nRCount: stm.readUInt16(), storageOffset: stm.readUInt16() };
        var fields = ["Copyright", "FamilyName", "FontSubfamilyName", "UniqueFontIdentifier", "FullFontName", "Version",
            "PostscriptName", "Trademark", "Manufacturer", "Designer", "Description", "UrlVendor", "UrlDesigner",
            "LicenseDescription", "LicenseInfoUrl"];
        var info = {};
        var txt = "Name Table Data(" + nameTable.nRCount + ")\n".concat(new Array(32).join("="), "\n");
        var nameRecords = [];

        for (i = 0; i < nameTable.nRCount; i++) {

            var nameRecord = {
                platformID: stm.readUInt16(),
                encodingID: stm.readUInt16(),
                languageID: stm.readUInt16(),
                nameID: stm.readUInt16(),
                stringLength: stm.readUInt16(),
                stringOffset: stm.readUInt16()
            }
            nameRecords.push(nameRecord);
        }
        var fName: string;
        for (var i = 0; i < nameRecords.length; i++) {
            nameRecord = nameRecords[i];
            if (nameRecord.nameID >= fields.length || nameRecord.nameID < 0)
                fName = "Uknow Id:0x".concat(nameRecord.nameID.toString(16))
            else
                fName = fields[nameRecord.nameID];

            var vpos = pos + nameRecord.stringOffset + nameTable.storageOffset;
            stm.seek(vpos, 1);
            var bin = stm.readBytes(nameRecord.stringLength);
            var name: string;
            var iSuccess = true;
            switch (nameRecord.encodingID) {
                case 1: name = Shotgun.Js.Charsets.bytesToString(bin, Encoder.Utf16_BE); break;
                case 0: name = Shotgun.Js.Charsets.bytesToString(bin, Encoder.Utf8); break;
                default: name = "#unsupported encoding:".concat(nameRecord.encodingID.toString(), "#"
                    , bytesToHex(bin, { noHead: true, width: 0, spliter: "" }));
                    iSuccess = false;
                    break;
            }

            txt = txt.concat(fName, "(LID:", nameRecord.languageID.toString(), "): ", name, "\n");
            //txt = txt.concat(JSON.stringify(nameRecord)).concat("\n");
            if (!iSuccess)
                continue;
            if (nameRecord.nameID == 4)
                info["FullName"] = name;
            else if (nameRecord.nameID == 14)
                info["License"] = name;
        }


        return { continue: false, message: "True Type Font", extension: "ttf", canDownload: true, property: info, result: txt, resultType: "text" };
    }
});

itIs.push({
    "flag": 0x774F46, "bits": 24, name: "WOFF",
    function(stm: MemoryStream) {
        var b = stm.readByte();
        var v = 1;
        if (b == 0x32)
            v = 2;
        else if (b != 0x46)
            return null;

        stm.bigEndian = true;
        var info = { "Version": "Woff".concat(v.toFixed()) };
        info["SfntVersion"] = stm.readUInt16().toString(16).concat(".", stm.readUInt16().toString(16));
        var val = stm.readUInt32();
        if (val != stm.getLength()) {
            console.log("len", val);
            return null;
        }
        var ret: IWhatIsPluginResult = {
            continue: false, message: "Web Open Font Format V" + v.toString(),
            extension: "woff".concat(v == 1 ? "" : v.toString()), canDownload: true, property: info
        };

        return ret;
    }
});