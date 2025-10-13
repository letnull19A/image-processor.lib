import { ImageSize, ImageFormat, DPRConfig } from '../interfaces/image-processing.interface';

export class ImageProcessingConfig {
  private _sizes: ImageSize[] = [
    { width: 320 },
    { width: 640 },
    { width: 1024 }
  ];

  private _formats: ImageFormat[] = [
    { type: 'webp', quality: 80 },
    { type: 'avif', quality: 80 }
  ];

  private _dpr: DPRConfig = {
    ratios: [1, 2, 3]
  };

  constructor(config?: Partial<ImageProcessingConfig>) {
    if (config?.sizes) {
      this._sizes = config.sizes;
    }
    if (config?.formats) {
      this._formats = config.formats;
    }
    if (config?.dpr) {
      this._dpr = { 
        ...config.dpr, 
        ratios: [...config.dpr.ratios] 
      };
    }
  }

  get sizes(): ImageSize[] {
    return [...this._sizes];
  }

  get formats(): ImageFormat[] {
    return [...this._formats];
  }

  get dpr(): DPRConfig {
    return { 
      ...this._dpr, 
      ratios: [...this._dpr.ratios] 
    };
  }

  setSizes(sizes: ImageSize[]): ImageProcessingConfig {
    this._sizes = [...sizes];
    return this;
  }

  setFormats(formats: ImageFormat[]): ImageProcessingConfig {
    this._formats = [...formats];
    return this;
  }

  setDPR(dpr: DPRConfig): ImageProcessingConfig {
    this._dpr = { 
      ...dpr, 
      ratios: [...dpr.ratios] 
    };
    return this;
  }

  addSize(size: ImageSize): ImageProcessingConfig {
    this._sizes.push(size);
    return this;
  }

  addFormat(format: ImageFormat): ImageProcessingConfig {
    this._formats.push(format);
    return this;
  }

  addDPRRatio(ratio: number): ImageProcessingConfig {
    if (!this._dpr.ratios.includes(ratio)) {
      this._dpr.ratios.push(ratio);
    }
    return this;
  }

  removeSize(width: number): ImageProcessingConfig {
    this._sizes = this._sizes.filter(size => size.width !== width);
    return this;
  }

  removeFormat(type: ImageFormat['type']): ImageProcessingConfig {
    this._formats = this._formats.filter(format => format.type !== type);
    return this;
  }

  removeDPRRatio(ratio: number): ImageProcessingConfig {
    this._dpr.ratios = this._dpr.ratios.filter(r => r !== ratio);
    return this;
  }
}
