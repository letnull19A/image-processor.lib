import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageValidator } from './image-validator';
import { UnsupportedImageFormatError, ImageValidationError } from '../errors/image-processing.errors';

describe('ImageValidator', () => {
  describe('validateMimeType', () => {
    it('should accept supported MIME types', () => {
      const supportedTypes = [
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

      supportedTypes.forEach(type => {
        expect(() => ImageValidator.validateMimeType(type)).not.toThrow();
      });
    });

    it('should reject unsupported MIME types', () => {
      const unsupportedTypes = [
        'text/plain',
        'application/pdf',
        'video/mp4',
        'image/unsupported'
      ];

      unsupportedTypes.forEach(type => {
        expect(() => ImageValidator.validateMimeType(type))
          .toThrow(UnsupportedImageFormatError);
      });
    });
  });

  describe('validateExtension', () => {
    it('should accept supported file extensions', () => {
      const supportedFiles = [
        'image.jpg',
        'photo.jpeg',
        'picture.png',
        'modern.webp',
        'nextgen.avif',
        'animated.gif',
        'bitmap.bmp',
        'tiff.tiff',
        'vector.svg'
      ];

      supportedFiles.forEach(filename => {
        expect(() => ImageValidator.validateExtension(filename)).not.toThrow();
      });
    });

    it('should reject unsupported file extensions', () => {
      const unsupportedFiles = [
        'document.txt',
        'file.pdf',
        'video.mp4',
        'noextension',
        'image.xyz'
      ];

      unsupportedFiles.forEach(filename => {
        expect(() => ImageValidator.validateExtension(filename))
          .toThrow(UnsupportedImageFormatError);
      });
    });
  });

  describe('validateFileSize', () => {
    it('should accept files within size limit', () => {
      const smallBuffer = Buffer.alloc(1024); // 1KB
      expect(() => ImageValidator.validateFileSize(smallBuffer, 10240)).not.toThrow();
    });

    it('should reject files exceeding size limit', () => {
      const largeBuffer = Buffer.alloc(10240); // 10KB
      expect(() => ImageValidator.validateFileSize(largeBuffer, 1024))
        .toThrow(ImageValidationError);
    });
  });

  describe('validateFile', () => {
    it('should validate complete file successfully', () => {
      const buffer = Buffer.alloc(1024);
      const filename = 'test.jpg';
      const mimeType = 'image/jpeg';

      expect(() => ImageValidator.validateFile(buffer, filename, mimeType, 10240))
        .not.toThrow();
    });

    it('should reject empty buffer', () => {
      const emptyBuffer = Buffer.alloc(0);
      const filename = 'test.jpg';

      expect(() => ImageValidator.validateFile(emptyBuffer, filename))
        .toThrow(ImageValidationError);
    });

    it('should reject null buffer', () => {
      const filename = 'test.jpg';

      expect(() => ImageValidator.validateFile(null as any, filename))
        .toThrow(ImageValidationError);
    });
  });
});
