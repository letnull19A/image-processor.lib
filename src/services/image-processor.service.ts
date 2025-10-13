import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { ImageSize, ImageFormat } from '../interfaces/image-processing.interface';
import { ImageProcessingFailedError } from '../errors/image-processing.errors';

export interface ProcessedImage {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
}

@Injectable()
export class ImageProcessorService {
  async processImage(
    buffer: Buffer,
    size: ImageSize,
    format: ImageFormat
  ): Promise<ProcessedImage> {
    try {
      let sharpInstance = sharp(buffer);

      // Resize image
      if (size.height) {
        sharpInstance = sharpInstance.resize(size.width, size.height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      } else {
        sharpInstance = sharpInstance.resize(size.width, null, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Convert to specified format
      switch (format.type) {
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality: format.quality || 80 });
          break;
        case 'avif':
          sharpInstance = sharpInstance.avif({ quality: format.quality || 80 });
          break;
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality: format.quality || 80 });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({ quality: format.quality || 80 });
          break;
        default:
          throw new ImageProcessingFailedError(`Unsupported output format: ${format.type}`);
      }

      const processedBuffer = await sharpInstance.toBuffer();
      const metadata = await sharp(processedBuffer).metadata();

      return {
        buffer: processedBuffer,
        format: format.type,
        width: metadata.width || size.width,
        height: metadata.height || size.height || 0
      };
    } catch (error) {
      if (error instanceof ImageProcessingFailedError) {
        throw error;
      }
      throw new ImageProcessingFailedError(
        `Failed to process image: ${error.message}`,
        error as Error
      );
    }
  }

  async getImageMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    try {
      return await sharp(buffer).metadata();
    } catch (error) {
      throw new ImageProcessingFailedError(
        `Failed to get image metadata: ${error.message}`,
        error as Error
      );
    }
  }

  async validateImage(buffer: Buffer): Promise<boolean> {
    try {
      await sharp(buffer).metadata();
      return true;
    } catch {
      return false;
    }
  }
}
