import { describe, it, expect, beforeEach } from 'vitest';
import { ImageProcessingConfig } from '../config/image-processing.config';
import { ImageSize, ImageFormat, DPRConfig } from '../interfaces/image-processing.interface';

describe('ImageProcessingConfig', () => {
  let config: ImageProcessingConfig;

  beforeEach(() => {
    config = new ImageProcessingConfig();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(config.sizes).toHaveLength(3);
      expect(config.sizes[0].width).toBe(320);
      expect(config.sizes[1].width).toBe(640);
      expect(config.sizes[2].width).toBe(1024);

      expect(config.formats).toHaveLength(2);
      expect(config.formats[0].type).toBe('webp');
      expect(config.formats[1].type).toBe('avif');

      expect(config.dpr.ratios).toEqual([1, 2, 3]);
    });

    it('should accept custom configuration', () => {
      const customSizes: ImageSize[] = [{ width: 100 }, { width: 200 }];
      const customFormats: ImageFormat[] = [{ type: 'jpeg', quality: 90 }];
      const customDPR: DPRConfig = { ratios: [1, 2] };

      const customConfig = new ImageProcessingConfig({
        sizes: customSizes,
        formats: customFormats,
        dpr: customDPR
      });

      expect(customConfig.sizes).toEqual(customSizes);
      expect(customConfig.formats).toEqual(customFormats);
      expect(customConfig.dpr).toEqual(customDPR);
    });
  });

  describe('setSizes', () => {
    it('should set new sizes', () => {
      const newSizes: ImageSize[] = [{ width: 100 }, { width: 200 }];
      const result = config.setSizes(newSizes);

      expect(result).toBe(config);
      expect(config.sizes).toEqual(newSizes);
    });

    it('should create a copy of sizes array', () => {
      const newSizes: ImageSize[] = [{ width: 100 }];
      config.setSizes(newSizes);

      newSizes.push({ width: 200 });
      expect(config.sizes).toHaveLength(1);
    });
  });

  describe('setFormats', () => {
    it('should set new formats', () => {
      const newFormats: ImageFormat[] = [{ type: 'jpeg', quality: 90 }];
      const result = config.setFormats(newFormats);

      expect(result).toBe(config);
      expect(config.formats).toEqual(newFormats);
    });

    it('should create a copy of formats array', () => {
      const newFormats: ImageFormat[] = [{ type: 'jpeg' }];
      config.setFormats(newFormats);

      newFormats.push({ type: 'png' });
      expect(config.formats).toHaveLength(1);
    });
  });

  describe('addSize', () => {
    it('should add new size', () => {
      const initialLength = config.sizes.length;
      const result = config.addSize({ width: 500 });

      expect(result).toBe(config);
      expect(config.sizes).toHaveLength(initialLength + 1);
      expect(config.sizes[config.sizes.length - 1].width).toBe(500);
    });
  });

  describe('addFormat', () => {
    it('should add new format', () => {
      const initialLength = config.formats.length;
      const result = config.addFormat({ type: 'jpeg', quality: 95 });

      expect(result).toBe(config);
      expect(config.formats).toHaveLength(initialLength + 1);
      expect(config.formats[config.formats.length - 1].type).toBe('jpeg');
    });
  });

  describe('removeSize', () => {
    it('should remove size by width', () => {
      const initialLength = config.sizes.length;
      const result = config.removeSize(320);

      expect(result).toBe(config);
      expect(config.sizes).toHaveLength(initialLength - 1);
      expect(config.sizes.find(size => size.width === 320)).toBeUndefined();
    });

    it('should not throw when removing non-existent size', () => {
      const initialLength = config.sizes.length;
      config.removeSize(999);

      expect(config.sizes).toHaveLength(initialLength);
    });
  });

  describe('removeFormat', () => {
    it('should remove format by type', () => {
      const initialLength = config.formats.length;
      const result = config.removeFormat('webp');

      expect(result).toBe(config);
      expect(config.formats).toHaveLength(initialLength - 1);
      expect(config.formats.find(format => format.type === 'webp')).toBeUndefined();
    });

    it('should not throw when removing non-existent format', () => {
      const initialLength = config.formats.length;
      config.removeFormat('jpeg' as any);

      expect(config.formats).toHaveLength(initialLength);
    });
  });

  describe('setDPR', () => {
    it('should set new DPR configuration', () => {
      const newDPR: DPRConfig = { ratios: [1, 2] };
      const result = config.setDPR(newDPR);

      expect(result).toBe(config);
      expect(config.dpr).toEqual(newDPR);
    });

    it('should create a copy of DPR configuration', () => {
      const newDPR: DPRConfig = { ratios: [1, 2] };
      config.setDPR(newDPR);

      // Modify the original array
      newDPR.ratios.push(3);
      // The config should still have the original values
      expect(config.dpr.ratios).toEqual([1, 2]);
    });
  });

  describe('addDPRRatio', () => {
    it('should add new DPR ratio', () => {
      const initialLength = config.dpr.ratios.length;
      const result = config.addDPRRatio(4);

      expect(result).toBe(config);
      expect(config.dpr.ratios).toHaveLength(initialLength + 1);
      expect(config.dpr.ratios).toContain(4);
    });

    it('should not add duplicate DPR ratio', () => {
      const initialLength = config.dpr.ratios.length;
      config.addDPRRatio(2); // 2 already exists

      expect(config.dpr.ratios).toHaveLength(initialLength);
    });
  });

  describe('removeDPRRatio', () => {
    it('should remove DPR ratio', () => {
      const initialLength = config.dpr.ratios.length;
      const result = config.removeDPRRatio(2);

      expect(result).toBe(config);
      expect(config.dpr.ratios).toHaveLength(initialLength - 1);
      expect(config.dpr.ratios.find(ratio => ratio === 2)).toBeUndefined();
    });

    it('should not throw when removing non-existent DPR ratio', () => {
      const initialLength = config.dpr.ratios.length;
      config.removeDPRRatio(999);

      expect(config.dpr.ratios).toHaveLength(initialLength);
    });
  });
});
