# Image Processor Library

Библиотека для эффективной обработки изображений в браузере с поддержкой современных форматов (WebP, AVIF) и адаптивных размеров для мобильных устройств.

## Особенности

- ✅ Поддержка современных форматов изображений (WebP, AVIF)
- ✅ Автоматическая генерация адаптивных размеров для `srcset`
- ✅ **Поддержка DPR (Device Pixel Ratio)** для Retina дисплеев
- ✅ Валидация загружаемых файлов
- ✅ Собственные классы ошибок
- ✅ Гибкая конфигурация размеров, форматов и DPR
- ✅ Поддержка различных драйверов хранения
- ✅ Полная типизация TypeScript
- ✅ Unit тесты с Vitest

## Технологический стек

- **TypeScript** - типизация
- **NestJS** - модульная архитектура
- **Sharp** - обработка изображений
- **Multer** - загрузка файлов
- **UUID v7** - генерация уникальных имен файлов

## Установка

```bash
npm install image-processor-lib
```

## Быстрый старт

### 1. Создайте драйвер хранения

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

### 2. Настройте модуль

```typescript
import { Module } from '@nestjs/common';
import { ImageProcessorModule } from 'image-processor-lib';
import { LocalStorageDriver } from './local-storage.driver';

@Module({
  imports: [
    ImageProcessorModule.forRoot({
      storageDriver: new LocalStorageDriver('./uploads'),
      config: new ImageProcessingConfig()
        .setSizes([
          { width: 320 },
          { width: 640 },
          { width: 1024 }
        ])
        .setFormats([
          { type: 'webp', quality: 85 },
          { type: 'avif', quality: 80 }
        ])
        .setDPR({ ratios: [1, 2, 3] }) // Support for 1x, 2x, 3x displays
    })
  ],
})
export class AppModule {}
```

### 3. Используйте в сервисе

```typescript
import { Injectable } from '@nestjs/common';
import { ImagePipelineService } from 'image-processor-lib';

@Injectable()
export class ImageService {
  constructor(private readonly imagePipeline: ImagePipelineService) {}

  async processImage(file: Express.Multer.File) {
    const result = await this.imagePipeline.processImage(
      file.buffer,
      file.originalname,
      file.mimetype,
      10 * 1024 * 1024 // 10MB max
    );

    return result;
    // Результат с поддержкой DPR:
    // {
    //   "original": "/uploads/originals/pic.jpg",
    //   "generated": {
    //     "webp": [
    //       "pic_320w@1x.webp",
    //       "pic_320w@2x.webp",
    //       "pic_320w@3x.webp",
    //       "pic_640w@1x.webp",
    //       "pic_640w@2x.webp",
    //       "pic_640w@3x.webp",
    //       "pic_1024w@1x.webp",
    //       "pic_1024w@2x.webp",
    //       "pic_1024w@3x.webp"
    //     ],
    //     "avif": [
    //       "pic_320w@1x.avif",
    //       "pic_320w@2x.avif",
    //       "pic_320w@3x.avif",
    //       "pic_640w@1x.avif",
    //       "pic_640w@2x.avif",
    //       "pic_640w@3x.avif",
    //       "pic_1024w@1x.avif",
    //       "pic_1024w@2x.avif",
    //       "pic_1024w@3x.avif"
    //     ]
    //   }
    // }
  }
}
```

## API

### ImagePipelineService

Основной сервис для обработки изображений.

#### `processImage(buffer, filename, mimeType?, maxSize?)`

Обрабатывает изображение и создает адаптивные версии.

**Параметры:**
- `buffer: Buffer` - буфер изображения
- `filename: string` - имя файла
- `mimeType?: string` - MIME тип (опционально)
- `maxSize?: number` - максимальный размер в байтах (опционально)

**Возвращает:** `Promise<ImageProcessingResult>`

#### `deleteImage(path)`

Удаляет изображение из хранилища.

#### `getImage(path)`

Получает изображение из хранилища.

### ImageProcessingConfig

Класс для настройки обработки изображений.

```typescript
const config = new ImageProcessingConfig()
  .setSizes([
    { width: 320 },
    { width: 640, height: 480 },
    { width: 1024 }
  ])
  .setFormats([
    { type: 'webp', quality: 85 },
    { type: 'avif', quality: 80 },
    { type: 'jpeg', quality: 90 }
  ])
  .setDPR({ ratios: [1, 2, 3] }); // Support for different pixel densities
```

### DPR (Device Pixel Ratio) Support

Библиотека поддерживает создание изображений для различных плотностей пикселей:

- **1x** - стандартные дисплеи
- **2x** - Retina дисплеи (iPhone, MacBook)
- **3x** - Super Retina дисплеи (iPhone Pro)

Это позволяет создавать четкие изображения для всех типов устройств:

```typescript
// Для размера 320px с DPR поддержкой создаются:
// - pic_320w@1x.webp (320px)
// - pic_320w@2x.webp (640px) 
// - pic_320w@3x.webp (960px)
```

### Поддерживаемые форматы

**Входные форматы:**
- JPEG/JPG
- PNG
- WebP
- AVIF
- GIF
- BMP
- TIFF
- SVG

**Выходные форматы:**
- WebP
- AVIF
- JPEG
- PNG

## Обработка ошибок

Библиотека предоставляет специализированные классы ошибок:

```typescript
import {
  ImageProcessingError,
  UnsupportedImageFormatError,
  ImageValidationError,
  ImageProcessingFailedError,
  StorageError
} from 'image-processor-lib';

try {
  await imagePipeline.processImage(buffer, filename);
} catch (error) {
  if (error instanceof UnsupportedImageFormatError) {
    // Обработка неподдерживаемого формата
  } else if (error instanceof ImageValidationError) {
    // Ошибка валидации
  } else if (error instanceof StorageError) {
    // Ошибка хранилища
  }
}
```

## Тестирование

```bash
npm test
npm run test:coverage
```

## Документация

📚 **[Полная документация](./docs/README.md)** - Все материалы в одном месте

### Основные документы:
- [**Руководство по использованию**](./docs/USAGE_GUIDE.md) - Полное руководство с примерами кода
- [**API Reference**](./docs/API_REFERENCE.md) - Документация всех интерфейсов и методов
- [**Примеры использования**](./docs/examples/) - Практические примеры интеграции

### Основные разделы документации:

- 🚀 **Быстрый старт** - Настройка за 5 минут
- ⚙️ **Конфигурация** - Гибкие настройки размеров, форматов и DPR
- 🔧 **Storage Drivers** - AWS S3, Cloudinary, локальное хранилище
- 📱 **DPR поддержка** - Retina дисплеи и адаптивные изображения
- 🛠️ **Интеграция** - NestJS, GraphQL, Bull Queue, Redis
- 🎯 **Лучшие практики** - Оптимизация производительности
- ❌ **Обработка ошибок** - Специализированные классы ошибок

### Примеры кода:

```typescript
// Базовая настройка
import { ImageProcessorModule } from 'image-processor-lib';

@Module({
  imports: [
    ImageProcessorModule.forRoot({
      sizes: [{ width: 320 }, { width: 640 }, { width: 1024 }],
      formats: [
        { type: 'webp', quality: 85 },
        { type: 'avif', quality: 80 }
      ],
      dpr: { ratios: [1, 2, 3] }
    })
  ]
})
export class AppModule {}

// Обработка изображения
const result = await imagePipeline.processImage(
  file.buffer,
  file.originalname,
  file.mimetype
);

// Результат с DPR поддержкой:
// {
//   "original": "/uploads/originals/uuid.jpg",
//   "generated": {
//     "webp": ["image_320w@1x.webp", "image_320w@2x.webp", "image_320w@3x.webp"],
//     "avif": ["image_320w@1x.avif", "image_320w@2x.avif", "image_320w@3x.avif"]
//   }
// }
```

## Лицензия

MIT
