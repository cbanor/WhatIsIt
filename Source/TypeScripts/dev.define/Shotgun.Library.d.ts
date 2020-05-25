

declare namespace Shotgun.Js {
  
      class Library {
        /*浏览器是否支持Uint8Array*/
        public static uint8ArraryDefined :boolean;
         

        public static parseHex(hexStr: string): Array<number> ;


        //public static isNullOrEmpty(str: string): boolean ;

        public static createUint8Array(size: number): Uint8Array;
        
        static byteSize(size: number, fractionDigits?: number  ): string;
        

    }
}
