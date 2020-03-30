declare var itIs: IWhatIsItPlgin[];

itIs.push(<IWhatIsItPlgin>{
    flag: 0x3082 >> 2, bits: 16 - 2, name: "PEM(PrivateKey)",

    getIntegerSize(binr: MemoryStream): number {
        var bt = 0, lowbyte = 0x00, highbyte = 0x00, count = 0;
        bt = binr.readByte();
        if (bt != 0x02)     //expect integer
            return 0;
        bt = binr.readByte();

        if (bt == 0x81)
            count = binr.readByte(); // data size in next byte
        else if (bt == 0x82) {
            count = binr.readByte() << 8;
            count |= binr.readByte();
        }
        else
            count = bt; // we already have the data size


        if (binr.readByte() == 0)
            count--;
        //else  //只读一次，则无需理会以下这一段
        //    binr.seek(-1, 0);
        return count;
    },
    getRSAPrivateKeyPKCS1(binr: MemoryStream, offset: number): IWhatIsPluginResult {
        var twobytes = binr.readUInt16();
        if (twobytes == 0x8130)//data read as little endian order (actual data order for Sequence is 30 81)  
            binr.position++;//advance 1 byte  
        else if (twobytes == 0x8230)
            binr.position += 2;//advance 2 bytes  
        else
            return null;

        twobytes = binr.readUInt16();
        if (twobytes != 0x0102) //version number
            return null;
        var bt = binr.readByte();
        if (bt != 0x00) return null;

        var len = this.getIntegerSize(binr);
        if (len === 0) return null;

        return {
            continue: false,
            message: "PEM Private Key",
            property: {
                KeySize: (len * 8).toString().concat("Bits"),
                KeyType: "Private Key + Public Key",
                Format: offset > 0 ? "PKCS8" : "PKCS1"
            }
        };
    },
    function(binr: MemoryStream) {
        var seqOID = [0x30, 0x0D, 0x06, 0x09, 0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x01, 0x01, 0x05, 0x00];


        binr.seek(0, 1);
        var twobytes = binr.readUInt16();
        if (twobytes == 0x8130)    //data read as little endian order (actual data order for Sequence is 30 81)  
            binr.position++;    //advance 1 byte  
        else if (twobytes == 0x8230)
            binr.position += 2;//advance 2 bytes  
        else
            return null;
        var bt = binr.readByte();
        if (bt != 0x02)
            return null;
        twobytes = binr.readUInt16();
        if (twobytes != 0x0001) return null;
        var sId = binr.readInt32();
        if (sId != 0x09060d30) //maybe is Sequence OID 
        {
            binr.seek(0, 1);
            return this.getRSAPrivateKeyPKCS1(binr, 0);
        }
        for (var i = 4; i < seqOID.length; i++) {//sId即前四位，可直接跳过
            if (binr.readByte() != seqOID[i]) return null;
        }
        bt = binr.readByte();
        if (bt != 0x04) return null;  //expect an Octet string  

        bt = binr.readByte();//read next byte, or next 2 bytes is  0x81 or 0x82; otherwise bt is the byte count  
        if (bt == 0x81)
            binr.position++;
        else if (bt == 0x82)
            binr.position += 2;
        return this.getRSAPrivateKeyPKCS1(binr, binr.position);
    }
});

itIs.push({
    flag: 0x3082 >> 2, bits: 16 - 2, name: "PEM(PublicKey)",
    function(binr: MemoryStream) {
        var seqOID = [0x30, 0x0D, 0x06, 0x09, 0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x01, 0x01, 0x05, 0x00];
        binr.seek(0, 1);
        var bt = 0, twobytes = 0;
        twobytes = binr.readUInt16();

        if (twobytes == 0x8130) //data read as little endian order (actual data order for Sequence is 30 81) -- 1024bit
            binr.position++;    //advance 1 byte
        else if (twobytes == 0x8230) //2048bit
            binr.position += 2;   //advance 2 bytes
        else //if (twobytes != 0x5C30) // 30 5C - 512 bit
            return;

        for (var i = 0; i < seqOID.length; i++) {//        //read the Sequence OID
            if (binr.readByte() != seqOID[i]) return null;
        }

        twobytes = binr.readUInt16();
        if (twobytes == 0x8103) //data read as little endian order (actual data order for Bit String is 03 81)
            binr.position++;    //advance 1 byte
        else if (twobytes == 0x8203)
            binr.position++;   //advance 2 bytes
        else //if (twobytes != 0x4B03) //512bit
            return null;

        bt = binr.readByte();
        if (bt != 0x00)     //expect null byte next
            return null;

        twobytes = binr.readUInt16();
        if (twobytes == 0x8130) //1024 data read as little endian order (actual data order for Sequence is 30 81)
            binr.position++;    //advance 1 byte
        else if (twobytes == 0x8230)//2048
            binr.position += 2;   //advance 2 bytes
        else if (twobytes != 0x4830) // 512
            return null;

        var modSize = 0;
        twobytes = binr.readUInt16();
        if (twobytes == 0x8102) //data read as little endian order (actual data order for Integer is 02 81)
            modSize = binr.readByte();  // read next bytes which is bytes in modulus
        else if (twobytes == 0x8202) //2048
            modSize = binr.readUInt16(); //advance 2 bytes
        else //if (twobytes != 0x4102)//512
            return null;
        if (modSize === 0)
            return null;
        if (binr.readByte() == 0)
            modSize--;

        return {
            continue: false,
            message: "PEM Public Key",
            property: {
                KeyType: "Public Key",
                KeySize: (modSize * 8).toString().concat("Bits"),
                Format: "PKCS8"
            }
        };
    }
});