export interface ImageProcessingResult {
  original: string;
  generated: {
    [format: string]: string[];
  };
}

export interface ImageSize {
  width: number;
  height?: number;
}

export interface ImageFormat {
  type: 'webp' | 'avif' | 'jpeg' | 'png';
  quality?: number;
}

export interface DPRConfig {
  ratios: number[];
}

export interface ImageProcessingConfig {
  sizes: ImageSize[];
  formats: ImageFormat[];
  dpr: DPRConfig;
}
