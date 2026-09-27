declare module "heic2any" {
  interface Heic2AnyOptions {
    blob: Blob;
    toType?: string;
    quality?: number;
    multiple?: boolean;
  }
  function heic2any(options: Heic2AnyOptions): Promise<Blob | Blob[]>;
  export default heic2any;
}

declare module "heic-to" {
  export interface HeicToOptions {
    blob: Blob;
    type?: string;
    quality?: number;
  }
  export function heicTo(options: HeicToOptions | Blob): Promise<Blob>;
}

