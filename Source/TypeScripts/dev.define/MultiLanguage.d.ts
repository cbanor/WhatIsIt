declare interface LanguageX {
    public: any
    base64: any
    cryptography: any,
    keyConverter: any,
    regular: any,
    asn1:any
}
declare interface Window {
    xLang: LanguageX
}
declare class $Localizer {
    static get(fmt: string, ...args: any[]): string;
    static libGet<K extends keyof LanguageX>(libName: K, fmt: string, ...args: any[]): string;
    static getRouteUrl(controller: string, action?: string): string;
}