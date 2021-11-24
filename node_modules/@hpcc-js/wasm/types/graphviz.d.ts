declare type Format = "svg" | "dot" | "json" | "dot_json" | "xdot_json" | "plain" | "plain-ext";
declare type Engine = "circo" | "dot" | "fdp" | "sfdp" | "neato" | "osage" | "patchwork" | "twopi";
interface Image {
    path: string;
    width: string;
    height: string;
}
interface File {
    path: string;
    data: string;
}
interface Ext {
    images?: Image[];
    files?: File[];
    wasmFolder?: string;
    wasmBinary?: Uint8Array;
    yInvert?: boolean;
    nop?: number;
}
export declare function graphvizVersion(wasmFolder?: string, wasmBinary?: Uint8Array): Promise<any>;
export declare const graphviz: {
    layout(dotSource: string, outputFormat?: Format, layoutEngine?: Engine, ext?: Ext | undefined): Promise<string>;
    circo(dotSource: string, outputFormat?: Format, ext?: Ext | undefined): Promise<string>;
    dot(dotSource: string, outputFormat?: Format, ext?: Ext | undefined): Promise<string>;
    fdp(dotSource: string, outputFormat?: Format, ext?: Ext | undefined): Promise<string>;
    sfdp(dotSource: string, outputFormat?: Format, ext?: Ext | undefined): Promise<string>;
    neato(dotSource: string, outputFormat?: Format, ext?: Ext | undefined): Promise<string>;
    osage(dotSource: string, outputFormat?: Format, ext?: Ext | undefined): Promise<string>;
    patchwork(dotSource: string, outputFormat?: Format, ext?: Ext | undefined): Promise<string>;
    twopi(dotSource: string, outputFormat?: Format, ext?: Ext | undefined): Promise<string>;
};
export declare class GraphvizSync {
    private _wasm;
    constructor(_wasm: any);
    layout(dotSource: string, outputFormat?: Format, layoutEngine?: Engine, ext?: Ext): string;
    circo(dotSource: string, outputFormat?: Format, ext?: Ext): string;
    dot(dotSource: string, outputFormat?: Format, ext?: Ext): string;
    fdp(dotSource: string, outputFormat?: Format, ext?: Ext): string;
    sfdp(dotSource: string, outputFormat?: Format, ext?: Ext): string;
    neato(dotSource: string, outputFormat?: Format, ext?: Ext): string;
    osage(dotSource: string, outputFormat?: Format, ext?: Ext): string;
    patchwork(dotSource: string, outputFormat?: Format, ext?: Ext): string;
    twopi(dotSource: string, outputFormat?: Format, ext?: Ext): string;
}
export declare function graphvizSync(wasmFolder?: string, wasmBinary?: Uint8Array): Promise<GraphvizSync>;
export {};
//# sourceMappingURL=graphviz.d.ts.map