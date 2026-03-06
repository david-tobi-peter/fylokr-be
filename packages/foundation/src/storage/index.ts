export interface IStorageProvider {
  upload(file: Buffer, path: string): Promise<string>;
  delete(path: string): Promise<void>;
  getUrl(path: string): string;
}

export abstract class BaseStorageProvider implements IStorageProvider {
  abstract upload(file: Buffer, path: string): Promise<string>;
  abstract delete(path: string): Promise<void>;
  abstract getUrl(path: string): string;
}
