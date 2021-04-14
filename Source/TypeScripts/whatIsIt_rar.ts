declare var itIs: IWhatIsItPlgin[];
const enum RARNumeric {
    byte,
    int16,
    int32,
    int64,
    vint
}
const enum RARHeaderType {
    MainArchive = 1,
    File = 2,
    Service = 3,
    ArchiveEncryption = 4,
    EndOfArchive = 5
}
interface IRARFalgSize {
    [key: number]: number
    total: number,
    flags: RarHeaderFlags
}
const enum RarHeaderFlags {
    /** Extra area is present in the end of header */
    ExtraArea = 0x0001,
    /** Data area is present in the end of header. */
    DataArea = 0x0002,
    /**Blocks with unknown type and this flag must be skipped when updating an archive. */
    BlocksWithUnknownType = 0x0004,
    /**Data area is continuing from previous volume. */
    DataAreaPreviousVolume = 0x0008,
    /**Data area is continuing in next volume. */
    DataAreaNextVolume = 0x0010,
    /**Block depends on preceding file block. */
    BlockDepends = 0x0020,
    /**Preserve a child block if host block is modified. */
    PreserveChildBlock = 0x0040
}

const enum RARFileFlags {
    /**   Directory file system object (file header only). */
    Directory = 0x0001,
    /**Time field in Unix format is present. */
    TimeField = 0x0002,
    /**CRC32 field is present. */
    CRC32 = 0x0004,
    /**Unpacked size is unknown. */
    SizeUnkonw = 0x0008
}
interface RarFileInfo {
    crc?: number,
    name: string,
    /** 文件大小,-1:大小未知 */
    size: number,
    isDirectory: boolean,
    modification?: Date,
    /** 压缩后大小 */
    compressSize: number,
    /** 0:win,1:unix */
    os: number

}

class WhatRARLibPlgin implements IWhatIsItPlgin {
    stm: MemoryStream;
    name = "RAR-Lab";
    flag = 0x52617221
    bits = 32;
    mode = "stream";
    version: number = 0;
    function(stm: MemoryStream): IWhatIsPluginResult {
        stm.bigEndian = false
        this.stm = stm;
        // 0x1A 0x07 0x01 0x00 
        if (stm.readUInt16() != 0x71a) return null;
        var flag = stm.readByte();
        switch (flag) {
            case 0x01:
                if (stm.readByte() !== 0) return null;
                this.version = 5;
                break;
            case 0x00: this.version = 4;
            default: return { continue: false, message: null, canDownload: true, extension: "rar", property: { "Version": "unsupported" } };
        }
        return this.readV5()
    }
    readV5(): IWhatIsPluginResult {
        const files: RarFileInfo[] = [];
        const result: IWhatIsPluginResult = {
            continue: false, message: null, property: { "Vresion": "5.0" },
            canDownload: true, extension: "rar"
        };
        while (!this.stm.endOfStream()) {
            const crc = this.getNumber(RARNumeric.int32);
            const hSize = this.getNumber(RARNumeric.vint);
            const position = this.stm.position;
            const hType = <RARHeaderType>this.getNumber(RARNumeric.vint);
            const headInfo = this.readAllHeadFlags();
            //console.log(headInfo, "pos:", position.toString(16), "hSize:", hSize);
            switch (hType) {
                case RARHeaderType.File:
                    files.push(this.readFileList(headInfo))
                    break;
                case RARHeaderType.ArchiveEncryption:
                    result.property["Fully encrypted"] = true;
                    return result;
                case RARHeaderType.MainArchive: //console.log("MainArchive"); break;
                default: //console.log("Unknow Haead:", hType);
                    break;
            }
            let bytesToSkip = hSize - (this.stm.position - position);
            if (headInfo.flags & RarHeaderFlags.DataArea) bytesToSkip += headInfo[RarHeaderFlags.DataArea]
            // console.log("head size", hSize, "seek:", bytesToSkip);
            this.stm.seek(bytesToSkip, 0)
            if (hType == RARHeaderType.EndOfArchive) {
                if (!this.stm.endOfStream())
                    result.property["Non-rar at tail"] = `${this.stm.getLength() - this.stm.position}Bytes`;
                break;
            }
        }
        if (!files.length) return { continue: false, message: null };
        var txt: string[] = ["Rar File Incluce:\n".concat(new Array(18).join("-"))]
        var totalSize: number = 0;

        files.forEach(e => {
            if (e.size < 0) totalSize = -1;
            else if (totalSize >= 0) totalSize += e.size;
            let t: string;
            if (e.isDirectory) t = "<directory>"
            else if (e.size < 0) t = "N/A"
            else t = `${Shotgun.Js.Library.byteSize(e.size)}Bytes`
            txt.push(`${t}\t${e.name}`);
        });
        result.property["Total Size"] = totalSize == -1 ? "unkonw" : totalSize
        result.result = txt.join('\n');
        result.resultType = "text"
        return result;
    }

    readFileList(headInfo: IRARFalgSize): RarFileInfo {
        //console.log("headFlags", headInfo);
        const flags = <RARFileFlags>this.getNumber(RARNumeric.vint);
        const file: RarFileInfo = <any>{ compressSize: 0 };
        if (headInfo.flags & RarHeaderFlags.DataArea) file.compressSize = headInfo[RarHeaderFlags.DataArea];
        file.isDirectory = !!(flags & RARFileFlags.Directory)

        file.size = this.getNumber(RARNumeric.vint);
        // console.log("flags:", flags);
        if (flags & RARFileFlags.SizeUnkonw) file.size = -1;
        this.getNumber(RARNumeric.vint);//skip Operating system specific file attributes in case of file header. Might be either used for data specific needs or just reserved and set to 0 for service header.

        if (flags & RARFileFlags.TimeField) file.modification = new Date(this.getNumber(RARNumeric.int32));
        if (flags & RARFileFlags.CRC32) file.crc = this.getNumber(RARNumeric.int32);
        this.getNumber(RARNumeric.vint);//skip Compression information	 
        file.os = this.getNumber(RARNumeric.vint);
        const nLen = this.getNumber(RARNumeric.vint);
        const bin = this.stm.readBytes(nLen);
        file.name = Shotgun.Js.Charsets.fromUtf8Bytes(bin);
        //console.log(file);
        return file;
    }
    readAllHeadFlags(): IRARFalgSize {
        let m = 1;
        let idx = 0;
        const r: IRARFalgSize = { total: 0, flags: this.getNumber(RARNumeric.vint) };

        do {
            idx++;
            if (!(m & r.flags)) continue;
            const s = this.getNumber(RARNumeric.vint);
            // console.log(`flag:0x${m.toString(16)}=>${s}`)
            r.total += r[idx] = s;
        } while ((m <<= 1) < 0x80);
        return r;
    }

    getNumber(type: RARNumeric): number {
        switch (type) {
            // case RARNumeric.byte: return this.stm.readByte();
            // case RARNumeric.int16: return this.stm.readUInt16();
            case RARNumeric.int32: return this.stm.readUInt32();
            case RARNumeric.vint: break;
            default: throw new Error(`Unsupport Numeric Type:${type}`);
        }
        let v: number;
        let r: number;
        let m = 7;
        do {
            v = this.stm.readByte();
            r |= (0x7f & v) << (m - 7);
            m += 7;
        } while (v > 0x7f);
        return r;
    }
}

itIs.push(new WhatRARLibPlgin());


