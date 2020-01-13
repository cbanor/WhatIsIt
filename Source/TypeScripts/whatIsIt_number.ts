declare var itIs: IWhatIsItPlgin[];
itIs.push({
    bits: 32, flag: 4, name: "Integer", mode: "fixedLength", function(stm: MemoryStream) {
        stm.seek(0, 1);
        stm.bigEndian = false;
        var lInt = stm.readInt32();
        if (lInt == 0) return null;
        stm.seek(0, 1);
        stm.bigEndian = true;
        var bInt = stm.readInt32();
        let ret: IWhatIsPluginResult = {
            continue: true, message: "May be an Integer.", property: { "BigEndian-Int32": bInt }
        };
        if (bInt < 0)
            ret.property["BigEndian-UInt32"] = bInt >>> 0;
        ret.property["LittleEndian-Int32"] = lInt;
        if (lInt < 0)
            ret.property["LittleEndian-UInt32"] = lInt >>> 0;
        return ret;
    }
});
itIs.push({
    bits: 16, flag: 2, name: "Int16", mode: "fixedLength", function(stm: MemoryStream) {
        stm.seek(0, 1);
        stm.bigEndian = false;
        var lInt = stm.readUInt16();
        if (lInt == 0) return null;
        stm.seek(0, 1);
        stm.bigEndian = true;
        var bInt = stm.readUInt16();
        let ret: IWhatIsPluginResult = {
            continue: true, message: "May be a Short Integer(Int16).", property: { "BigEndian-Int16": bInt }
        };
        ret.property["LittleEndian-Int16"] = lInt;
        return ret;
    }
});