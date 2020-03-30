declare var itIs: IWhatIsItPlgin[];

itIs.push({
    "flag": 0xFFd8, "bits": 16, "name": "Jpeg",
    function(_stream: MemoryStream) {
        var flag;
        var dLen = 0;
        _stream.bigEndian = true;
        flag = _stream.readUInt16();
        switch (flag) {
            case 0xffe0://indicating a JFIF or JTIP file.
            case 0xffe1:// indicating an Exif file.
            case 0xffe8:// indicating a SPIFF file.
            case 0xfff7://ISO xxx?
        }
        dLen = _stream.readUInt16();
        var sign = String.fromCharCode(_stream.readByte());
        sign += String.fromCharCode(_stream.readByte());
        sign += String.fromCharCode(_stream.readByte());
        sign += String.fromCharCode(_stream.readByte());
        console.warn(sign);
        _stream.seek(dLen - 6, 0);


        while (!_stream.endOfStream()) {
            var val = _stream.readByte();
            if (val !== 0xfF)//Error File!
                break;
            flag = _stream.readByte();

            if (flag === 0xD9 || flag === 0xDA)//图像结束或图像数据开始
                break;
            switch (flag) {
                case 0xC2://sign:JFIF
                case 0xC0://sign:Exif  SOF0，Start of Frame，帧图像开始

                    dLen = _stream.readUInt16();// bin[0] << 8 | bin[1];
                    _stream.seek(1, 0);
                    dLen = 0;
                    var height = _stream.readUInt16();//size.Height = data[1] << 8 | data[2];
                    var width = _stream.readUInt16();// size.Width = data[3] << 8 | data[4];

                    return {
                        continue: false,
                        message: "Jpeg Image(".concat(sign).concat(")"),
                        mimeType: "image/jpeg",
                        extension: "jpg",
                        canDownload: true,
                        property: { "Size": (width + "x" + height), "foramt": sign }
                    };//无需读取其它数据

                //case 0xD9://EOI，End of Image，图像结束 2字节
                //case 0xDA://Start of Scan，扫描开始 12字节 图像数据，通常，到文件结束,遇到EOI标记
                case 0xC4://DHT，Difine Huffman Table，定义哈夫曼表
                case 0xDD:// DRI，Define Restart Interval，定义差分编码累计复位的间隔
                case 0xDB:// DQT，Define Quantization Table，定义量化表
                case 0xE0://APP0，Application，应用程序保留标记0。版本，DPI等信息
                case 0xE1://APPn，Application，应用程序保留标记n，其中n=1～15(任选)
                    dLen = _stream.readUInt16() - 2;
                    //DataLen = bin[0] << 8 | bin[1];
                    //DataLen -= 2;
                    break;
                default:
                    if (flag > 0xE1 && flag < 0xEF)//APPx
                        dLen = _stream.readUInt16() - 2;//goto case 0xE1;
                    //格式错误？？
                    break;
            }
            if (dLen !== 0) {
                _stream.seek(dLen, 0);
                dLen = 0;
            }
        }
        return null;

    }
});

itIs.push({
    "flag": 0x89504e47, "bits": 32, "name": "Png",
    function(_stream: MemoryStream) {
        //const PNG_HEAD = 0x89504e47;
        const PNG_HEAD_2 = 0x0d0a1a0a;// PNG标识签名 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A;
        //this._stream.seek(0, 1);

        //var c = _stream.readUIni16() //前一步已经处理
        //if (c !== PNG_HEAD) return false;
        _stream.bigEndian = true;

        var c = _stream.readInt32();
        if (c !== PNG_HEAD_2) return null;

        var Field: number;
        while (!_stream.endOfStream()) {
            c = _stream.readInt32();
            Field = _stream.readInt32();//本应该转换成字串然后比较，但为了方便直接采用int四字节比较
            switch (Field) {
                case 0x49484452://"IHDR"://文件头数据块 
                    var width = _stream.readInt32();
                    var height = _stream.readInt32();

                    return {
                        continue: false,
                        message: "Png Image",
                        mimeType: "image/png",
                        extension: "png",
                        canDownload: true,
                        property: { "Size": (width + "x" + height) }
                    };//无需读取其它数据
                case 0x73424954://"sBIT":
                case 0x70485973://"pHYs":
                case 0x74455874://"tEXt":
                case 0x49444154://"IDAT"://LZ77图片数据
                case 0x49454E44://"IEND"://文件结尾
                default:
                    //if (console) console.log("PNG flag:", Field.toString("x"));
                    break;
            }
            _stream.seek(c, 0);//跳过不需要处理的数据
        }
        return null;
    }
});

itIs.push({
    "flag": 0x47494638, "bits": 32, "name": "Gif",
    function(_stream: MemoryStream) {
        _stream.bigEndian = true;
        var s = _stream.readUInt16();
        if (s !== 0x3961 && s !== 0x3761) //'9a'或 7a 前一函数已经读取GIF8
            return null;
        _stream.bigEndian = false;
        var width = _stream.readUInt16();
        var height = _stream.readUInt16();
        return {
            continue: false,
            message: "Gif Image",
            mimeType: "image/gif", extension: "gif",
            canDownload: true,
            property: { "Size": (width + "x" + height) }
        };
    }
});

itIs.push({
    "flag": 0x424D, "bits": 16, "name": "Bmp",
    function(_stream: MemoryStream) {
        //this._stream.seek(2, 1);
        var len = _stream.readUInt32();
        if (len !== _stream.getLength()) return null; //bmp size == file size
        _stream.seek(18, 1);
        var width = _stream.readInt32();// bin[18] | bin[19] << 8 | bin[20] << 16 | bin[21] << 24;
        var height = _stream.readInt32();// size.Height = bin[22] | bin[23] << 8 | bin[24] << 16 | bin[25] << 24;
        if (width < 0) width = ~width + 1; //取反加1，负变正
        if (height < 0) height = ~height + 1;

        return {
            continue: false,
            message: "Bmp Image",
            mimeType: "image/bmp",
            extension: "bmp",
            canDownload: true,
            property: { "Size": (width + "x" + height) }
        };
    }
});