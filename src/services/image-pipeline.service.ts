import { Injectable, Inject } from '@nestjs/common';
import { StorageDriver } from '../interfaces/storage-driver.interface';
import { ImageProcessingResult } from '../interfaces/image-processing.interface';
import { ImageProcessorService } from './image-processor.service';
import { ImageProcessingConfig } from '../config/image-processing.config';
import { ImageValidator } from '../utils/image-validator';
import { FileNamingUtils } from '../utils/file-naming.utils';
import { StorageError, ImageProcessingFailedError } from '../errors/image-processing.errors';

export const STORAGE_DRIVER = Symbol('STORAGE_DRIVER');

@Injectable()
export class ImagePipelineService {
  constructor(
    private readonly imageProcessor: ImageProcessorService,
    @Inject(STORAGE_DRIVER)
    private readonly storageDriver: StorageDriver,
    private readonly config: ImageProcessingConfig
  ) {}

  async processImage(
    buffer: Buffer,
    originalFilename: string,
    mimeType?: string,
    maxSizeInBytes?: number
  ): Promise<ImageProcessingResult> {
    try {
      // Validate input
      ImageValidator.validateFile(buffer, originalFilename, mimeType, maxSizeInBytes);

      // Validate image with Sharp
      const isValidImage = await this.imageProcessor.validateImage(buffer);
      if (!isValidImage) {
        throw new ImageProcessingFailedError('Invalid image file');
      }

      // Generate original filename and path
      const originalPath = FileNamingUtils.generateOriginalPath(originalFilename);
      
      // Upload original file
      await this.uploadFile(originalPath, buffer);
      
      // Process image in different sizes, formats and DPR ratios
      const generatedFiles: { [format: string]: string[] } = {};
      
      // Initialize format arrays
      for (const format of this.config.formats) {
        generatedFiles[format.type] = [];
      }
      
      for (const size of this.config.sizes) {
        for (const format of this.config.formats) {
          for (const dprRatio of this.config.dpr.ratios) {
            try {
              // Calculate actual size for DPR
              const actualSize = {
                width: size.width * dprRatio,
                height: size.height ? size.height * dprRatio : undefined
              };

              const processedImage = await this.imageProcessor.processImage(buffer, actualSize, format);
              const generatedFileName = FileNamingUtils.generateFileName(
                originalFilename,
                size.width,
                format.type,
                dprRatio
              );
              
              const generatedPath = await this.uploadFile(generatedFileName, processedImage.buffer);
              generatedFiles[format.type].push(generatedPath);
            } catch (error) {
              // Log error but continue processing other sizes/formats/DPR
              console.error(`Failed to process image for size ${size.width}, format ${format.type}, DPR ${dprRatio}:`, error);
            }
          }
        }
      }

      return {
        original: originalPath,
        generated: generatedFiles
      };
    } catch (error) {
      if (error instanceof StorageError || error instanceof ImageProcessingFailedError) {
        throw error;
      }
      throw new ImageProcessingFailedError(
        `Pipeline processing failed: ${error.message}`,
        error as Error
      );
    }
  }

  async deleteImage(imagePath: string): Promise<void> {
    try {
      await this.storageDriver.delete(imagePath);
    } catch (error) {
      throw new StorageError(
        `Failed to delete image: ${error.message}`,
        error as Error
      );
    }
  }

  async getImage(imagePath: string): Promise<Buffer> {
    try {
      return await this.storageDriver.download(imagePath);
    } catch (error) {
      throw new StorageError(
        `Failed to get image: ${error.message}`,
        error as Error
      );
    }
  }

  private async uploadFile(filename: string, buffer: Buffer): Promise<string> {
    try {
      return await this.storageDriver.upload(filename, buffer);
    } catch (error) {
      throw new StorageError(
        `Failed to upload file ${filename}: ${error.message}`,
        error as Error
      );
    }
  }

  updateConfig(config: ImageProcessingConfig): void {
    Object.assign(this.config, config);
  }
}
