export interface StorageDriver {
  upload(path: string, data: Buffer): Promise<string>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
}
