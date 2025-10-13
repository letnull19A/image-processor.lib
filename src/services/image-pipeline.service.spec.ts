import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImagePipelineService, STORAGE_DRIVER } from '../services/image-pipeline.service';
import { ImageProcessorService } from '../services/image-processor.service';
import { ImageProcessingConfig } from '../config/image-processing.config';
import { StorageDriver } from '../interfaces/storage-driver.interface';
import { ImageProcessingResult } from '../interfaces/image-processing.interface';
import { StorageError, ImageProcessingFailedError } from '../errors/image-processing.errors';

// Mock storage driver
class MockStorageDriver implements StorageDriver {
  private files = new Map<string, Buffer>();

  async upload(path: string, data: Buffer): Promise<string> {
    this.files.set(path, data);
    return path;
  }

  async download(path: string): Promise<Buffer> {
    const data = this.files.get(path);
    if (!data) {
      throw new Error('File not found');
    }
    return data;
  }

  async delete(path: string): Promise<void> {
    if (!this.files.has(path)) {
      throw new Error('File not found');
    }
    this.files.delete(path);
  }
}

describe('ImagePipelineService', () => {
  let service: ImagePipelineService;
  let mockStorageDriver: MockStorageDriver;
  let mockImageProcessor: ImageProcessorService;
  let config: ImageProcessingConfig;

  beforeEach(() => {
    mockStorageDriver = new MockStorageDriver();
    config = new ImageProcessingConfig();
    
    // Mock ImageProcessorService
    mockImageProcessor = {
      validateImage: vi.fn().mockResolvedValue(true),
      processImage: vi.fn().mockImplementation(async (buffer, size, format) => ({
        buffer: Buffer.from('processed'),
        format: format.type,
        width: size.width,
        height: size.height || 0
      })),
      getImageMetadata: vi.fn()
    } as any;

    service = new ImagePipelineService(
      mockImageProcessor,
      mockStorageDriver,
      config
    );
  });

  describe('processImage', () => {
    it('should process image successfully', async () => {
      const buffer = Buffer.from('test image data');
      const filename = 'test.jpg';
      const mimeType = 'image/jpeg';

      const result = await service.processImage(buffer, filename, mimeType);

      expect(result).toHaveProperty('original');
      expect(result).toHaveProperty('generated');
      expect(typeof result.generated).toBe('object');
      expect(result.generated).toHaveProperty('webp');
      expect(result.generated).toHaveProperty('avif');
      expect(Array.isArray(result.generated.webp)).toBe(true);
      expect(Array.isArray(result.generated.avif)).toBe(true);
    });

    it('should validate input file', async () => {
      const invalidBuffer = Buffer.alloc(0);
      const filename = 'test.jpg';

      await expect(service.processImage(invalidBuffer, filename))
        .rejects.toThrow(ImageProcessingFailedError);
    });

    it('should handle image processing errors gracefully', async () => {
      const buffer = Buffer.from('test image data');
      const filename = 'test.jpg';
      
      // Mock processor to throw error
      mockImageProcessor.processImage = vi.fn().mockRejectedValue(new Error('Processing failed'));

      const result = await service.processImage(buffer, filename);

      // Should still return result with original file
      expect(result).toHaveProperty('original');
      expect(result.generated.webp).toHaveLength(0);
      expect(result.generated.avif).toHaveLength(0);
    });

    it('should handle storage errors', async () => {
      const buffer = Buffer.from('test image data');
      const filename = 'test.jpg';
      
      // Mock storage to throw error
      mockStorageDriver.upload = vi.fn().mockRejectedValue(new Error('Storage failed'));

      await expect(service.processImage(buffer, filename))
        .rejects.toThrow(StorageError);
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      const path = 'test.jpg';
      const buffer = Buffer.from('test');
      await mockStorageDriver.upload(path, buffer);

      await expect(service.deleteImage(path)).resolves.not.toThrow();
    });

    it('should handle delete errors', async () => {
      const path = 'nonexistent.jpg';
      
      await expect(service.deleteImage(path))
        .rejects.toThrow(StorageError);
    });
  });

  describe('getImage', () => {
    it('should get image successfully', async () => {
      const path = 'test.jpg';
      const buffer = Buffer.from('test');
      await mockStorageDriver.upload(path, buffer);

      const result = await service.getImage(path);
      expect(result).toEqual(buffer);
    });

    it('should handle get image errors', async () => {
      const path = 'nonexistent.jpg';
      
      await expect(service.getImage(path))
        .rejects.toThrow(StorageError);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = new ImageProcessingConfig()
        .setSizes([{ width: 100 }])
        .setFormats([{ type: 'jpeg' }]);

      service.updateConfig(newConfig);

      expect(service['config'].sizes).toEqual([{ width: 100 }]);
      expect(service['config'].formats).toEqual([{ type: 'jpeg' }]);
    });
  });
});
