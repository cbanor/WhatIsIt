
itIs.push(<IWhatIsItPlgin>{
    "flag": (0x3080 >> 2), "bits": 14, "name": "ASN.1", "mode": "stream",
    function(stm: MemoryStream) {
        var result: IWhatIsPluginResult;
        if (typeof Shotgun.Js.Security.ASN1 == "undefined") {
            result = { continue: true, message: "May be Asn.1 encoded data"};
            var lnk = document.createElement("a");
            lnk.innerHTML = "ASN.1 Decodeing Tool";
            lnk.href = $Localizer.getRouteUrl("encodings", "Asn1").concat("#from=whatPlugin");
            lnk.target = "_blank";
            result.result = lnk;
            result.resultType = "html";
            return result;
        }
        stm.bigEndian = true;
        stm.seek(0, 1);

        var asn1Obj = Shotgun.Js.Security.ASN1.parse(stm);
        if (asn1Obj == null) return null;

        var struct = Shotgun.Js.Security.ASN1.toStruct(asn1Obj);
        var bin = Shotgun.Js.Charsets.toUtf8Bytes(struct);
        var crc = crc32(bin);

        var rlt: IWhatIsPluginResult = null;
        var func: Function = null;
        switch (crc) {
            case 3885816356: func = this.pemPubKey; break;
            case 738967784: func = this.pemPriKeyP8; break;
            case 720893746: func = this.pemPriKeyP1; break;
            case 3704700438: func = this.pemDsaPubKey; break;
            case 3376003983: func = this.pemDsaPriKey; break;
            case 4246618493: func = this.pemPriKeyEncrpyted; break;
            default: console.warn(crc, struct); break;
        }

        
        if (func != null) {
            try {
                result = func.call(this, asn1Obj);
            } catch (e) {
                console.error(e);
                result = null;
            }

        }
        if (result == null)
            result = { continue: false, message: "ASN.1"  };
        if (result.result != null) return result;
        var lnk = document.createElement("a");
        lnk.innerHTML = "ASN.1 Decoding Tool";

        lnk.href = $Localizer.getRouteUrl("encodings", "Asn1").concat("#from=whatPlugin");
        lnk.target = "_blank";
        result.result = lnk;
        result.resultType = "html";

        return result;


    },
    isTypeOf(asn: IASN1Object, type: ASN1Type): boolean {
        return asn != null && asn.type == type;
    },
    pemPubKey(asn: IASN1Object): IWhatIsPluginResult {
        var node = Shotgun.Js.Security.ASN1.getChild(asn, [1, 0, 0]);
        var bytes = node.dataLength;
        if (bytes > 4)
            if (+(<string>(node.value)).substr(0, 2) == 0) bytes--;
        return {
            continue: false,
            message: "RSA Public Key",
            property: {
                KeyType: "Public Key",
                KeySize: String.format("{0} bits", (bytes * 8)),
                Format: "PKCS8"
            }
        };
    },
    pemPriKeyP8(asn: IASN1Object): IWhatIsPluginResult {
        var node = Shotgun.Js.Security.ASN1.getChild(asn, [2, 0, 1]);
        var bytes = node.dataLength;
        if (bytes > 4)
            if (+(<string>(node.value)).substr(0, 2) == 0) bytes--;
        return {
            continue: false,
            message: "RSA Private Key",
            property: {
                KeySize: String.format("{0} bits", bytes * 8),
                KeyType: "Private Key + Public Key",
                Format: "PKCS8"
            }
        };
    },
    pemPriKeyP1(asn: IASN1Object): IWhatIsPluginResult {
        var nums = <Array<IASN1Object>>asn.value;
        if (nums.length != 9) return null;
        var node = nums[1];
        var bytes = node.dataLength;
        if (node.isHexVaule)
            if (+(<string>(node.value)).substr(0, 2) == 0) bytes--;
        return {
            continue: false,
            message: "RSA Private Key",
            property: {
                KeySize: String.format("{0} bits", bytes * 8),
                KeyType: "Private Key + Public Key",
                Format: "PKCS1"
            }
        };
    },
    pemDsaPubKey(asn: IASN1Object): IWhatIsPluginResult {
        var node = Shotgun.Js.Security.ASN1.getChild(asn, [0, 1, 0]);
        var bytes = node.dataLength;
        if (node.isHexVaule)
            if (+(<string>(node.value)).substr(0, 2) == 0) bytes--;
        return {
            continue: false,
            message: "DSA Public Key",
            property: { KeySize: String.format("{0} bits", bytes * 8) }
        };
    },
    pemDsaPriKey(asn: IASN1Object): IWhatIsPluginResult {

        var node = Shotgun.Js.Security.ASN1.getChild(asn, [1, 1, 0]);
        var bytes = node.dataLength;
        if (node.isHexVaule)
            if (+(<string>(node.value)).substr(0, 2) == 0) bytes--;
        return {
            continue: false,
            message: "DSA Private Key",
            property: {
                KeySize: String.format("{0} bits", bytes * 8)
            }
        };
    },
    pemPriKeyEncrpyted(asn: IASN1Object): IWhatIsPluginResult {
        return {
            continue: false,
            message: "Encrypted RSA Private Key",
            property: { Format: "PKCS8", Encrypted: true }
        };
    }
});

(function() {
    if (typeof Shotgun.Js.Security.ASN1 != "undefined") return;
    var js = document.createElement("script");
    js.defer = true;
    js.async = true;
    js.src = "/scripts/shotgun.js.security.asn1.min.js";
    document.scripts[0].parentElement.appendChild(js);
})();