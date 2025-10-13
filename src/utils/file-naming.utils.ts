import { v4 as uuidv4 } from 'uuid';

export class FileNamingUtils {
  static generateFileName(originalName: string, width: number, format: string, dpr: number = 1): string {
    const baseName = this.getBaseName(originalName);
    
    return `${baseName}_${width}w@${dpr}x.${format}`;
  }

  static generateOriginalFileName(originalName: string): string {
    const uuid = uuidv4();
    const extension = this.getFileExtension(originalName);
    
    return `${uuid}${extension}`;
  }

  static generateOriginalPath(originalName: string, basePath: string = '/uploads/originals'): string {
    const fileName = this.generateOriginalFileName(originalName);
    return `${basePath}/${fileName}`;
  }

  private static getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return '';
    }
    return filename.substring(lastDotIndex);
  }

  private static getBaseName(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return filename;
    }
    return filename.substring(0, lastDotIndex);
  }
}
