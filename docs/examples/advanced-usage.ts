import { 
  ImageProcessingConfig, 
  ImagePipelineService,
  ImageProcessorService,
  ImageValidator,
  FileNamingUtils,
  StorageDriver,
  ImageProcessingResult,
  ImageSize,
  ImageFormat
} from '../src';
import { Injectable, Inject } from '@nestjs/common';

// 1. Продвинутая конфигурация для разных типов контента
export class AdvancedImageConfigs {
  
  // Конфигурация для аватаров пользователей
  static getAvatarConfig(): ImageProcessingConfig {
    return new ImageProcessingConfig()
      .setSizes([
        { width: 32, height: 32 },   // Мини аватар
        { width: 64, height: 64 },   // Маленький аватар
        { width: 128, height: 128 }, // Средний аватар
        { width: 256, height: 256 }  // Большой аватар
      ])
      .setFormats([
        { type: 'webp', quality: 90 },
        { type: 'jpeg', quality: 95 } // Высокое качество для аватаров
      ])
      .setDPR({ ratios: [1, 2] });
  }

  // Конфигурация для галереи изображений
  static getGalleryConfig(): ImageProcessingConfig {
    return new ImageProcessingConfig()
      .setSizes([
        { width: 150 },   // Thumbnail
        { width: 400 },   // Preview
        { width: 800 },   // Medium
        { width: 1200 },  // Large
        { width: 1920 }   // Full size
      ])
      .setFormats([
        { type: 'avif', quality: 80 },
        { type: 'webp', quality: 85 },
        { type: 'jpeg', quality: 90 }
      ])
      .setDPR({ ratios: [1, 2, 3] });
  }

  // Конфигурация для баннеров и hero изображений
  static getBannerConfig(): ImageProcessingConfig {
    return new ImageProcessingConfig()
      .setSizes([
        { width: 320, height: 180 },  // Мобильный баннер
        { width: 768, height: 432 },  // Планшет баннер
        { width: 1200, height: 675 }, // Десктоп баннер
        { width: 1920, height: 1080 } // Full HD баннер
      ])
      .setFormats([
        { type: 'webp', quality: 85 },
        { type: 'jpeg', quality: 90 }
      ])
      .setDPR({ ratios: [1, 2] });
  }

  // Конфигурация для товарных изображений
  static getProductConfig(): ImageProcessingConfig {
    return new ImageProcessingConfig()
      .setSizes([
        { width: 100 },   // Миниатюра в списке
        { width: 300 },   // Карточка товара
        { width: 600 },   // Детальная страница
        { width: 1200 }   // Увеличенное изображение
      ])
      .setFormats([
        { type: 'avif', quality: 85 },
        { type: 'webp', quality: 90 },
        { type: 'jpeg', quality: 95 }
      ])
      .setDPR({ ratios: [1, 2, 3] });
  }
}

// 2. AWS S3 Storage Driver
export class S3StorageDriver implements StorageDriver {
  private s3: any;

  constructor(
    private bucket: string,
    private region: string = 'us-east-1',
    private accessKeyId?: string,
    private secretAccessKey?: string
  ) {
    // Инициализация AWS S3 клиента
    // this.s3 = new AWS.S3({
    //   region: this.region,
    //   accessKeyId: this.accessKeyId,
    //   secretAccessKey: this.secretAccessKey
    // });
  }

  async upload(path: string, data: Buffer): Promise<string> {
    // const result = await this.s3.upload({
    //   Bucket: this.bucket,
    //   Key: path,
    //   Body: data,
    //   ContentType: this.getContentType(path),
    //   ACL: 'public-read'
    // }).promise();
    
    // return result.Location;
    return path; // Заглушка для примера
  }

  async download(path: string): Promise<Buffer> {
    // const result = await this.s3.getObject({
    //   Bucket: this.bucket,
    //   Key: path
    // }).promise();
    
    // return result.Body as Buffer;
    return Buffer.alloc(0); // Заглушка для примера
  }

  async delete(path: string): Promise<void> {
    // await this.s3.deleteObject({
    //   Bucket: this.bucket,
    //   Key: path
    // }).promise();
  }

  private getContentType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'avif': 'image/avif'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

// 3. Продвинутый сервис обработки изображений
@Injectable()
export class AdvancedImageService {
  private configs: Map<string, ImageProcessingConfig> = new Map();

  constructor(
    private readonly imagePipeline: ImagePipelineService,
    private readonly imageProcessor: ImageProcessorService
  ) {
    // Инициализация конфигураций
    this.configs.set('avatar', AdvancedImageConfigs.getAvatarConfig());
    this.configs.set('gallery', AdvancedImageConfigs.getGalleryConfig());
    this.configs.set('banner', AdvancedImageConfigs.getBannerConfig());
    this.configs.set('product', AdvancedImageConfigs.getProductConfig());
  }

  // Обработка изображения с определенной конфигурацией
  async processWithConfig(
    buffer: Buffer,
    originalName: string,
    configType: string,
    mimeType?: string,
    maxSize?: number
  ): Promise<ImageProcessingResult> {
    const config = this.configs.get(configType);
    if (!config) {
      throw new Error(`Неизвестный тип конфигурации: ${configType}`);
    }

    // Сохраняем текущую конфигурацию
    const originalConfig = this.imagePipeline.config;
    
    try {
      // Применяем новую конфигурацию
      this.imagePipeline.updateConfig(config);
      
      // Обрабатываем изображение
      return await this.imagePipeline.processImage(
        buffer,
        originalName,
        mimeType,
        maxSize
      );
    } finally {
      // Восстанавливаем оригинальную конфигурацию
      this.imagePipeline.updateConfig(originalConfig);
    }
  }

  // Массовая обработка изображений
  async batchProcess(
    files: Array<{ buffer: Buffer; name: string; mimeType?: string }>,
    configType: string
  ): Promise<ImageProcessingResult[]> {
    const results: ImageProcessingResult[] = [];
    
    for (const file of files) {
      try {
        const result = await this.processWithConfig(
          file.buffer,
          file.name,
          configType,
          file.mimeType
        );
        results.push(result);
      } catch (error) {
        console.error(`Ошибка обработки ${file.name}:`, error.message);
        // Продолжаем обработку других файлов
      }
    }
    
    return results;
  }

  // Анализ изображения
  async analyzeImage(buffer: Buffer): Promise<{
    metadata: any;
    isValid: boolean;
    size: number;
    format?: string;
    dimensions?: { width: number; height: number };
  }> {
    const isValid = await this.imageProcessor.validateImage(buffer);
    
    if (!isValid) {
      return {
        metadata: null,
        isValid: false,
        size: buffer.length
      };
    }

    const metadata = await this.imageProcessor.getImageMetadata(buffer);
    
    return {
      metadata,
      isValid: true,
      size: buffer.length,
      format: metadata.format,
      dimensions: {
        width: metadata.width || 0,
        height: metadata.height || 0
      }
    };
  }

  // Создание кастомной конфигурации
  createCustomConfig(
    sizes: ImageSize[],
    formats: ImageFormat[],
    dprRatios: number[]
  ): ImageProcessingConfig {
    return new ImageProcessingConfig()
      .setSizes(sizes)
      .setFormats(formats)
      .setDPR({ ratios: dprRatios });
  }

  // Валидация и предобработка
  async preprocessImage(
    buffer: Buffer,
    originalName: string,
    mimeType?: string,
    maxSize?: number
  ): Promise<{
    buffer: Buffer;
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let processedBuffer = buffer;

    // Валидация файла
    try {
      ImageValidator.validateFile(buffer, originalName, mimeType, maxSize);
    } catch (error) {
      errors.push(`Валидация файла: ${error.message}`);
    }

    // Валидация изображения
    const isValidImage = await this.imageProcessor.validateImage(buffer);
    if (!isValidImage) {
      errors.push('Файл не является валидным изображением');
    }

    // Проверка размера изображения
    const metadata = await this.imageProcessor.getImageMetadata(buffer);
    if (metadata.width && metadata.width < 100) {
      errors.push('Изображение слишком маленькое (минимум 100px)');
    }
    if (metadata.height && metadata.height < 100) {
      errors.push('Изображение слишком маленькое (минимум 100px)');
    }

    return {
      buffer: processedBuffer,
      isValid: errors.length === 0,
      errors
    };
  }
}

// 4. Сервис для работы с метаданными
@Injectable()
export class ImageMetadataService {
  constructor(private readonly imageProcessor: ImageProcessorService) {}

  async extractMetadata(buffer: Buffer): Promise<{
    basic: any;
    exif?: any;
    icc?: any;
    iptc?: any;
  }> {
    const metadata = await this.imageProcessor.getImageMetadata(buffer);
    
    return {
      basic: {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size: metadata.size,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        space: metadata.space,
        channels: metadata.channels
      },
      exif: metadata.exif,
      icc: metadata.icc,
      iptc: metadata.iptc
    };
  }

  async hasTransparency(buffer: Buffer): Promise<boolean> {
    const metadata = await this.imageProcessor.getImageMetadata(buffer);
    return metadata.hasAlpha || false;
  }

  async getColorSpace(buffer: Buffer): Promise<string> {
    const metadata = await this.imageProcessor.getImageMetadata(buffer);
    return metadata.space || 'unknown';
  }
}

// 5. Кэширующий сервис изображений
@Injectable()
export class CachedImageService {
  private cache = new Map<string, Buffer>();
  private readonly CACHE_TTL = 3600000; // 1 час
  private cacheTimestamps = new Map<string, number>();

  constructor(
    private readonly imagePipeline: ImagePipelineService
  ) {}

  async getCachedImage(path: string): Promise<Buffer> {
    const now = Date.now();
    const timestamp = this.cacheTimestamps.get(path);
    
    // Проверяем, не истек ли кэш
    if (timestamp && now - timestamp > this.CACHE_TTL) {
      this.cache.delete(path);
      this.cacheTimestamps.delete(path);
    }

    // Возвращаем из кэша или загружаем
    if (this.cache.has(path)) {
      return this.cache.get(path)!;
    }

    const buffer = await this.imagePipeline.getImage(path);
    this.cache.set(path, buffer);
    this.cacheTimestamps.set(path, now);
    
    return buffer;
  }

  async invalidateCache(path: string): Promise<void> {
    this.cache.delete(path);
    this.cacheTimestamps.delete(path);
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  getCacheStats(): {
    size: number;
    entries: string[];
    oldestEntry?: string;
    newestEntry?: string;
  } {
    const entries = Array.from(this.cache.keys());
    const timestamps = Array.from(this.cacheTimestamps.entries());
    
    const sorted = timestamps.sort((a, b) => a[1] - b[1]);
    
    return {
      size: this.cache.size,
      entries,
      oldestEntry: sorted[0]?.[0],
      newestEntry: sorted[sorted.length - 1]?.[0]
    };
  }
}

// 6. Сервис для оптимизации изображений
@Injectable()
export class ImageOptimizationService {
  constructor(private readonly imageProcessor: ImageProcessorService) {}

  // Автоматический выбор лучшего формата
  async optimizeFormat(buffer: Buffer): Promise<{
    recommendedFormat: string;
    quality: number;
    estimatedSize: number;
  }> {
    const metadata = await this.imageProcessor.getImageMetadata(buffer);
    const hasTransparency = metadata.hasAlpha;
    
    let recommendedFormat: string;
    let quality: number;
    
    if (hasTransparency) {
      recommendedFormat = 'png';
      quality = 95;
    } else {
      recommendedFormat = 'webp';
      quality = 85;
    }

    // Примерная оценка размера (в реальности нужно было бы конвертировать)
    const estimatedSize = Math.round(buffer.length * 0.7);

    return {
      recommendedFormat,
      quality,
      estimatedSize
    };
  }

  // Создание responsive изображений
  async createResponsiveSet(
    buffer: Buffer,
    baseName: string
  ): Promise<{
    sizes: Array<{ width: number; format: string; path: string }>;
    srcSet: string;
  }> {
    const sizes = [320, 640, 1024, 1920];
    const formats = ['webp', 'jpeg'];
    const results: Array<{ width: number; format: string; path: string }> = [];
    const srcSetParts: string[] = [];

    for (const width of sizes) {
      for (const format of formats) {
        const fileName = FileNamingUtils.generateFileName(baseName, width, format);
        results.push({ width, format, path: fileName });
        
        // Добавляем в srcSet только webp (основной формат)
        if (format === 'webp') {
          srcSetParts.push(`${fileName} ${width}w`);
        }
      }
    }

    return {
      sizes: results,
      srcSet: srcSetParts.join(', ')
    };
  }
}

// 7. Пример использования всех сервисов
@Injectable()
export class ImageProcessingOrchestrator {
  constructor(
    private readonly advancedService: AdvancedImageService,
    private readonly metadataService: ImageMetadataService,
    private readonly cachedService: CachedImageService,
    private readonly optimizationService: ImageOptimizationService
  ) {}

  async processImageCompletely(
    buffer: Buffer,
    originalName: string,
    configType: string
  ): Promise<{
    result: ImageProcessingResult;
    analysis: any;
    optimization: any;
    responsive: any;
  }> {
    // 1. Предобработка и валидация
    const preprocessing = await this.advancedService.preprocessImage(
      buffer,
      originalName
    );

    if (!preprocessing.isValid) {
      throw new Error(`Предобработка не удалась: ${preprocessing.errors.join(', ')}`);
    }

    // 2. Анализ изображения
    const analysis = await this.advancedService.analyzeImage(buffer);
    const metadata = await this.metadataService.extractMetadata(buffer);

    // 3. Оптимизация
    const optimization = await this.optimizationService.optimizeFormat(buffer);

    // 4. Обработка с выбранной конфигурацией
    const result = await this.advancedService.processWithConfig(
      buffer,
      originalName,
      configType
    );

    // 5. Создание responsive набора
    const responsive = await this.optimizationService.createResponsiveSet(
      buffer,
      originalName
    );

    return {
      result,
      analysis: {
        ...analysis,
        metadata
      },
      optimization,
      responsive
    };
  }
}
