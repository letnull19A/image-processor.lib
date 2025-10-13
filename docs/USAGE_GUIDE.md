# Image Processor Library - Руководство по использованию

## Обзор

`image-processor-lib` - это NestJS библиотека для обработки изображений с поддержкой современных форматов (WebP, AVIF) и DPR (Device Pixel Ratio). Библиотека автоматически создает множественные варианты изображений в разных размерах, форматах и DPR соотношениях.

## Основные возможности

- 🖼️ **Обработка изображений** с помощью Sharp
- 📱 **Поддержка DPR** (1x, 2x, 3x) для Retina дисплеев
- 🎨 **Современные форматы** WebP и AVIF
- 🔧 **Гибкая конфигурация** размеров и качества
- 💾 **Абстракция хранилища** - поддержка любых storage драйверов
- ✅ **Валидация** файлов и изображений
- 🏗️ **TypeScript** поддержка из коробки

## Установка

```bash
npm install image-processor-lib sharp
```

## Быстрый старт

### 1. Базовая настройка модуля

```typescript
import { Module } from '@nestjs/common';
import { ImageProcessorModule } from 'image-processor-lib';

@Module({
  imports: [
    ImageProcessorModule.forRoot({
      sizes: [
        { width: 320 },
        { width: 640 },
        { width: 1024 }
      ],
      formats: [
        { type: 'webp', quality: 85 },
        { type: 'avif', quality: 80 }
      ],
      dpr: { ratios: [1, 2, 3] }
    })
  ]
})
export class AppModule {}
```

### 2. Создание Storage Driver

```typescript
import { StorageDriver } from 'image-processor-lib';
import { promises as fs } from 'fs';
import { join } from 'path';

export class LocalStorageDriver implements StorageDriver {
  constructor(private baseDir: string = './uploads') {}

  async upload(path: string, data: Buffer): Promise<string> {
    const fullPath = join(this.baseDir, path);
    await fs.mkdir(join(fullPath, '..'), { recursive: true });
    await fs.writeFile(fullPath, data);
    return path;
  }

  async download(path: string): Promise<Buffer> {
    const fullPath = join(this.baseDir, path);
    return fs.readFile(fullPath);
  }

  async delete(path: string): Promise<void> {
    const fullPath = join(this.baseDir, path);
    await fs.unlink(fullPath);
  }
}
```

### 3. Регистрация Storage Driver

```typescript
import { Module } from '@nestjs/common';
import { ImageProcessorModule, STORAGE_DRIVER } from 'image-processor-lib';
import { LocalStorageDriver } from './local-storage.driver';

@Module({
  imports: [
    ImageProcessorModule.forRoot({
      // конфигурация...
    })
  ],
  providers: [
    {
      provide: STORAGE_DRIVER,
      useClass: LocalStorageDriver
    }
  ]
})
export class AppModule {}
```

### 4. Использование в сервисе

```typescript
import { Injectable } from '@nestjs/common';
import { ImagePipelineService } from 'image-processor-lib';

@Injectable()
export class UploadService {
  constructor(
    private readonly imagePipeline: ImagePipelineService
  ) {}

  async uploadImage(file: Express.Multer.File) {
    const result = await this.imagePipeline.processImage(
      file.buffer,
      file.originalname,
      file.mimetype,
      5 * 1024 * 1024 // 5MB лимит
    );

    return {
      original: result.original,
      variants: result.generated
    };
  }
}
```

## Подробная конфигурация

### ImageProcessingConfig

```typescript
import { ImageProcessingConfig, ImageSize, ImageFormat } from 'image-processor-lib';

const config = new ImageProcessingConfig()
  .setSizes([
    { width: 320 },           // Мобильные устройства
    { width: 640 },           // Планшеты
    { width: 1024 },          // Десктоп
    { width: 1920 },          // Большие экраны
    { width: 400, height: 300 } // Фиксированные пропорции
  ])
  .setFormats([
    { type: 'webp', quality: 85 },  // Современные браузеры
    { type: 'avif', quality: 80 },  // Самый новый формат
    { type: 'jpeg', quality: 90 }   // Fallback для старых браузеров
  ])
  .setDPR({ ratios: [1, 2, 3] }); // 1x, 2x, 3x дисплеи

// Добавление отдельных размеров и форматов
config.addSize({ width: 800 })
     .addFormat({ type: 'png', quality: 95 })
     .addDPRRatio(4); // Для очень плотных дисплеев

// Удаление элементов
config.removeSize(800)
     .removeFormat('png')
     .removeDPRRatio(4);
```

### Результат обработки

После обработки изображения вы получите объект следующей структуры:

```typescript
{
  "original": "/uploads/originals/uuid.jpg",
  "generated": {
    "webp": [
      "image_320w@1x.webp",
      "image_320w@2x.webp", 
      "image_320w@3x.webp",
      "image_640w@1x.webp",
      "image_640w@2x.webp",
      "image_640w@3x.webp",
      "image_1024w@1x.webp",
      "image_1024w@2x.webp",
      "image_1024w@3x.webp"
    ],
    "avif": [
      "image_320w@1x.avif",
      "image_320w@2x.avif",
      "image_320w@3x.avif",
      "image_640w@1x.avif", 
      "image_640w@2x.avif",
      "image_640w@3x.avif",
      "image_1024w@1x.avif",
      "image_1024w@3x.avif"
    ]
  }
}
```

## Продвинутые сценарии использования

### 1. Обработка изображений в контроллере

```typescript
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImagePipelineService } from 'image-processor-lib';

@Controller('images')
export class ImageController {
  constructor(
    private readonly imagePipeline: ImagePipelineService
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    try {
      const result = await this.imagePipeline.processImage(
        file.buffer,
        file.originalname,
        file.mimetype,
        10 * 1024 * 1024 // 10MB лимит
      );

      return {
        success: true,
        data: {
          original: result.original,
          variants: result.generated
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
```

### 2. Кастомная конфигурация для разных типов изображений

```typescript
import { ImageProcessingConfig } from 'image-processor-lib';

// Конфигурация для аватаров
const avatarConfig = new ImageProcessingConfig()
  .setSizes([
    { width: 64, height: 64 },   // Маленький аватар
    { width: 128, height: 128 }, // Средний аватар
    { width: 256, height: 256 }  // Большой аватар
  ])
  .setFormats([
    { type: 'webp', quality: 90 },
    { type: 'jpeg', quality: 95 }
  ])
  .setDPR({ ratios: [1, 2] });

// Конфигурация для галереи
const galleryConfig = new ImageProcessingConfig()
  .setSizes([
    { width: 320 },  // Thumbnail
    { width: 640 },  // Preview
    { width: 1280 }, // Full size
    { width: 1920 }  // High resolution
  ])
  .setFormats([
    { type: 'avif', quality: 80 },
    { type: 'webp', quality: 85 },
    { type: 'jpeg', quality: 90 }
  ])
  .setDPR({ ratios: [1, 2, 3] });
```

### 3. Обновление конфигурации во время выполнения

```typescript
@Injectable()
export class DynamicImageService {
  constructor(
    private readonly imagePipeline: ImagePipelineService
  ) {}

  async updateImageConfig(config: ImageProcessingConfig) {
    // Обновление конфигурации для новых загрузок
    this.imagePipeline.updateConfig(config);
  }

  async processWithCustomConfig(
    buffer: Buffer, 
    filename: string,
    customConfig: ImageProcessingConfig
  ) {
    // Сохраняем текущую конфигурацию
    const originalConfig = this.imagePipeline.config;
    
    try {
      // Временно применяем новую конфигурацию
      this.imagePipeline.updateConfig(customConfig);
      
      // Обрабатываем изображение
      return await this.imagePipeline.processImage(buffer, filename);
    } finally {
      // Восстанавливаем оригинальную конфигурацию
      this.imagePipeline.updateConfig(originalConfig);
    }
  }
}
```

### 4. Работа с метаданными изображений

```typescript
import { ImageProcessorService } from 'image-processor-lib';

@Injectable()
export class ImageMetadataService {
  constructor(
    private readonly imageProcessor: ImageProcessorService
  ) {}

  async analyzeImage(buffer: Buffer) {
    const metadata = await this.imageProcessor.getImageMetadata(buffer);
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      space: metadata.space,
      channels: metadata.channels
    };
  }

  async validateImage(buffer: Buffer): Promise<boolean> {
    return this.imageProcessor.validateImage(buffer);
  }
}
```

### 5. Управление файлами

```typescript
@Injectable()
export class ImageManagementService {
  constructor(
    private readonly imagePipeline: ImagePipelineService
  ) {}

  async getImage(path: string): Promise<Buffer> {
    return this.imagePipeline.getImage(path);
  }

  async deleteImage(path: string): Promise<void> {
    await this.imagePipeline.deleteImage(path);
  }

  async deleteImageVariants(originalPath: string, generatedVariants: any) {
    // Удаляем оригинал
    await this.deleteImage(originalPath);
    
    // Удаляем все варианты
    for (const format in generatedVariants) {
      for (const variant of generatedVariants[format]) {
        await this.deleteImage(variant);
      }
    }
  }
}
```

## Storage Drivers

### AWS S3 Driver

```typescript
import { S3 } from 'aws-sdk';
import { StorageDriver } from 'image-processor-lib';

export class S3StorageDriver implements StorageDriver {
  constructor(
    private s3: S3,
    private bucket: string
  ) {}

  async upload(path: string, data: Buffer): Promise<string> {
    await this.s3.upload({
      Bucket: this.bucket,
      Key: path,
      Body: data,
      ContentType: this.getContentType(path)
    }).promise();
    
    return path;
  }

  async download(path: string): Promise<Buffer> {
    const result = await this.s3.getObject({
      Bucket: this.bucket,
      Key: path
    }).promise();
    
    return result.Body as Buffer;
  }

  async delete(path: string): Promise<void> {
    await this.s3.deleteObject({
      Bucket: this.bucket,
      Key: path
    }).promise();
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
```

### Cloudinary Driver

```typescript
import { v2 as cloudinary } from 'cloudinary';
import { StorageDriver } from 'image-processor-lib';

export class CloudinaryStorageDriver implements StorageDriver {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  async upload(path: string, data: Buffer): Promise<string> {
    const publicId = path.replace(/\.(jpg|jpeg|png|webp|avif)$/i, '');
    
    const result = await cloudinary.uploader.upload(
      `data:image/${this.getFormat(path)};base64,${data.toString('base64')}`,
      { public_id: publicId }
    );
    
    return result.public_id;
  }

  async download(path: string): Promise<Buffer> {
    const url = cloudinary.url(path);
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async delete(path: string): Promise<void> {
    await cloudinary.uploader.destroy(path);
  }

  private getFormat(path: string): string {
    return path.split('.').pop()?.toLowerCase() || 'jpg';
  }
}
```

## Утилиты

### Валидация файлов

```typescript
import { ImageValidator } from 'image-processor-lib';

// Проверка MIME типа
const isValidMimeType = ImageValidator.validateMimeType('image/jpeg');

// Проверка расширения файла
const isValidExtension = ImageValidator.validateExtension('image.jpg');

// Проверка размера файла
const isValidSize = ImageValidator.validateFileSize(buffer, 5 * 1024 * 1024);

// Полная валидация
try {
  ImageValidator.validateFile(buffer, 'image.jpg', 'image/jpeg', 5 * 1024 * 1024);
  console.log('Файл валиден');
} catch (error) {
  console.error('Ошибка валидации:', error.message);
}
```

### Генерация имен файлов

```typescript
import { FileNamingUtils } from 'image-processor-lib';

// Генерация имени для обработанного изображения
const fileName = FileNamingUtils.generateFileName('photo.jpg', 640, 'webp', 2);
// Результат: "photo_640w@2x.webp"

// Генерация уникального имени для оригинала
const originalName = FileNamingUtils.generateOriginalFileName('photo.jpg');
// Результат: "uuid.jpg"

// Генерация полного пути
const path = FileNamingUtils.generateOriginalPath('photo.jpg', '/uploads');
// Результат: "/uploads/uuid.jpg"
```

## Обработка ошибок

```typescript
import {
  ImageProcessingError,
  UnsupportedImageFormatError,
  ImageValidationError,
  StorageError
} from 'image-processor-lib';

@Injectable()
export class ImageService {
  async processImage(buffer: Buffer, filename: string) {
    try {
      return await this.imagePipeline.processImage(buffer, filename);
    } catch (error) {
      if (error instanceof ImageValidationError) {
        // Ошибка валидации - неверный формат или размер
        throw new BadRequestException('Некорректный файл изображения');
      }
      
      if (error instanceof UnsupportedImageFormatError) {
        // Неподдерживаемый формат
        throw new BadRequestException('Неподдерживаемый формат изображения');
      }
      
      if (error instanceof StorageError) {
        // Ошибка хранилища
        throw new InternalServerErrorException('Ошибка сохранения файла');
      }
      
      if (error instanceof ImageProcessingError) {
        // Общая ошибка обработки
        throw new InternalServerErrorException('Ошибка обработки изображения');
      }
      
      // Неизвестная ошибка
      throw new InternalServerErrorException('Внутренняя ошибка сервера');
    }
  }
}
```

## Лучшие практики

### 1. Оптимизация производительности

```typescript
// Используйте подходящие размеры для ваших нужд
const config = new ImageProcessingConfig()
  .setSizes([
    { width: 320 },  // Мобильные
    { width: 768 },  // Планшеты  
    { width: 1200 }, // Десктоп
    { width: 1920 }  // Большие экраны
  ])
  .setFormats([
    { type: 'webp', quality: 80 }, // Основной формат
    { type: 'jpeg', quality: 85 }  // Fallback
  ])
  .setDPR({ ratios: [1, 2] }); // 1x и 2x достаточно для большинства случаев
```

### 2. Мониторинг и логирование

```typescript
@Injectable()
export class ImageProcessingLogger {
  private readonly logger = new Logger('ImageProcessing');

  async logProcessingResult(result: ImageProcessingResult) {
    const totalVariants = Object.values(result.generated)
      .reduce((total, variants) => total + variants.length, 0);
    
    this.logger.log(`Processed image: ${result.original}, generated ${totalVariants} variants`);
  }

  async logProcessingError(error: Error, filename: string) {
    this.logger.error(`Failed to process ${filename}: ${error.message}`, error.stack);
  }
}
```

### 3. Кэширование

```typescript
@Injectable()
export class CachedImageService {
  constructor(
    private readonly imagePipeline: ImagePipelineService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getCachedImage(path: string): Promise<Buffer> {
    const cacheKey = `image:${path}`;
    let imageBuffer = await this.cacheManager.get<Buffer>(cacheKey);
    
    if (!imageBuffer) {
      imageBuffer = await this.imagePipeline.getImage(path);
      await this.cacheManager.set(cacheKey, imageBuffer, 3600); // 1 час
    }
    
    return imageBuffer;
  }
}
```

## Примеры интеграции

### С Multer для загрузки файлов

```typescript
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './temp',
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}-${file.originalname}`);
        }
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Неподдерживаемый формат файла'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
      }
    })
  ]
})
export class UploadModule {}
```

### С GraphQL

```typescript
import { Resolver, Mutation, Arg } from '@nestjs/graphql';
import { GraphQLUpload } from 'graphql-upload';

@Resolver()
export class ImageResolver {
  constructor(
    private readonly imagePipeline: ImagePipelineService
  ) {}

  @Mutation(() => ImageUploadResult)
  async uploadImage(
    @Arg('file', () => GraphQLUpload) file: any
  ): Promise<ImageUploadResult> {
    const { createReadStream, filename, mimetype } = await file;
    
    const chunks = [];
    const stream = createReadStream();
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    
    const result = await this.imagePipeline.processImage(
      buffer,
      filename,
      mimetype
    );
    
    return {
      original: result.original,
      variants: result.generated
    };
  }
}
```

## Заключение

Библиотека `image-processor-lib` предоставляет мощный и гибкий инструмент для обработки изображений в NestJS приложениях. С поддержкой современных форматов, DPR и абстракцией хранилища, она идеально подходит для создания масштабируемых веб-приложений с высоким качеством изображений.

Для получения дополнительной информации и примеров кода, обратитесь к [документации API](./API_REFERENCE.md) или [исходному коду](./src/).
