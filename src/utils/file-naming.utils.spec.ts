import { describe, it, expect } from 'vitest';
import { FileNamingUtils } from '../utils/file-naming.utils';

describe('FileNamingUtils', () => {
  describe('generateFileName', () => {
    it('should generate filename with DPR support', () => {
      const filename = FileNamingUtils.generateFileName('pic.jpg', 320, 'webp', 2);
      
      expect(filename).toBe('pic_320w@2x.webp');
    });

    it('should generate filename with default DPR (1x)', () => {
      const filename = FileNamingUtils.generateFileName('pic.jpg', 320, 'webp');
      
      expect(filename).toBe('pic_320w@1x.webp');
    });

    it('should handle different DPR ratios', () => {
      const ratios = [1, 2, 3];
      
      ratios.forEach(ratio => {
        const filename = FileNamingUtils.generateFileName('pic.jpg', 640, 'avif', ratio);
        expect(filename).toBe(`pic_640w@${ratio}x.avif`);
      });
    });
  });

  describe('generateOriginalFileName', () => {
    it('should generate original filename with UUID', () => {
      const filename = FileNamingUtils.generateOriginalFileName('pic.jpg');
      
      expect(filename).toMatch(/^[a-f0-9-]+\.jpg$/);
    });

    it('should preserve file extension', () => {
      const extensions = ['.jpg', '.png', '.webp', '.avif'];
      
      extensions.forEach(ext => {
        const filename = FileNamingUtils.generateOriginalFileName(`pic${ext}`);
        expect(filename).toMatch(new RegExp(`^[a-f0-9-]+\\${ext}$`));
      });
    });
  });

  describe('generateOriginalPath', () => {
    it('should generate original path with default base path', () => {
      const path = FileNamingUtils.generateOriginalPath('pic.jpg');
      
      expect(path).toMatch(/^\/uploads\/originals\/[a-f0-9-]+\.jpg$/);
    });

    it('should generate original path with custom base path', () => {
      const path = FileNamingUtils.generateOriginalPath('pic.jpg', '/custom/path');
      
      expect(path).toMatch(/^\/custom\/path\/[a-f0-9-]+\.jpg$/);
    });
  });
});
