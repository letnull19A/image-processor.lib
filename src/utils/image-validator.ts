import { ImageValidationError, UnsupportedImageFormatError } from '../errors/image-processing.errors';

export class ImageValidator {
  private static readonly SUPPORTED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/svg+xml'
  ];

  private static readonly SUPPORTED_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp', '.tiff', '.svg'
  ];

  static validateMimeType(mimeType: string): void {
    if (!this.SUPPORTED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      throw new UnsupportedImageFormatError(mimeType);
    }
  }

  static validateExtension(filename: string): void {
    const extension = this.getFileExtension(filename);
    if (!this.SUPPORTED_EXTENSIONS.includes(extension.toLowerCase())) {
      throw new UnsupportedImageFormatError(extension);
    }
  }

  static validateFileSize(buffer: Buffer, maxSizeInBytes: number = 10 * 1024 * 1024): void {
    if (buffer.length > maxSizeInBytes) {
      throw new ImageValidationError(`File size exceeds maximum allowed size of ${maxSizeInBytes} bytes`);
    }
  }

  static validateFile(buffer: Buffer, filename: string, mimeType?: string, maxSizeInBytes?: number): void {
    if (!buffer || buffer.length === 0) {
      throw new ImageValidationError('File buffer is empty');
    }

    this.validateExtension(filename);
    
    if (mimeType) {
      this.validateMimeType(mimeType);
    }

    if (maxSizeInBytes) {
      this.validateFileSize(buffer, maxSizeInBytes);
    }
  }

  private static getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return '';
    }
    return filename.substring(lastDotIndex);
  }
}
