# API Reference - Image Processor Library

## Интерфейсы

### ImageProcessingResult

Результат обработки изображения.

```typescript
interface ImageProcessingResult {
  original: string;           // Путь к оригинальному файлу
  generated: {               // Сгенерированные варианты
    [format: string]: string[]; // Массив путей для каждого формата
  };
}
```

**Пример:**
```typescript
{
  "original": "/uploads/originals/uuid.jpg",
  "generated": {
    "webp": ["image_320w@1x.webp", "image_320w@2x.webp"],
    "avif": ["image_320w@1x.avif", "image_320w@2x.avif"]
  }
}
```

### ImageSize

Конфигурация размера изображения.

```typescript
interface ImageSize {
  width: number;    // Ширина в пикселях
  height?: number;  // Высота в пикселях (опционально)
}
```

**Примеры:**
```typescript
{ width: 320 }                    // Только ширина
{ width: 400, height: 300 }       // Фиксированные размеры
```

### ImageFormat

Конфигурация формата изображения.

```typescript
interface ImageFormat {
  type: 'webp' | 'avif' | 'jpeg' | 'png';
  quality?: number;  // Качество от 1 до 100 (по умолчанию 80)
}
```

**Примеры:**
```typescript
{ type: 'webp', quality: 85 }
{ type: 'avif', quality: 80 }
{ type: 'jpeg', quality: 90 }
```

### DPRConfig

Конфигурация DPR (Device Pixel Ratio).

```typescript
interface DPRConfig {
  ratios: number[];  // Массив DPR соотношений
}
```

**Пример:**
```typescript
{ ratios: [1, 2, 3] }  // Поддержка 1x, 2x, 3x дисплеев
```

### StorageDriver

Интерфейс для драйверов хранилища.

```typescript
interface StorageDriver {
  upload(path: string, data: Buffer): Promise<string>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
}
```

## Классы

### ImageProcessingConfig

Класс для конфигурации обработки изображений.

#### Конструктор

```typescript
constructor(config?: Partial<ImageProcessingConfig>)
```

#### Свойства

```typescript
get sizes(): ImageSize[]           // Получить размеры
get formats(): ImageFormat[]       // Получить форматы
get dpr(): DPRConfig              // Получить DPR конфигурацию
```

#### Методы

```typescript
// Установка конфигураций
setSizes(sizes: ImageSize[]): ImageProcessingConfig
setFormats(formats: ImageFormat[]): ImageProcessingConfig
setDPR(dpr: DPRConfig): ImageProcessingConfig

// Добавление элементов
addSize(size: ImageSize): ImageProcessingConfig
addFormat(format: ImageFormat): ImageProcessingConfig
addDPRRatio(ratio: number): ImageProcessingConfig

// Удаление элементов
removeSize(width: number): ImageProcessingConfig
removeFormat(type: ImageFormat['type']): ImageProcessingConfig
removeDPRRatio(ratio: number): ImageProcessingConfig
```

**Примеры использования:**

```typescript
const config = new ImageProcessingConfig()
  .setSizes([{ width: 320 }, { width: 640 }])
  .setFormats([{ type: 'webp', quality: 85 }])
  .setDPR({ ratios: [1, 2] });

// Добавление нового размера
config.addSize({ width: 1024 });

// Удаление формата
config.removeFormat('webp');
```

### ImageProcessorModule

NestJS модуль для интеграции библиотеки.

#### Статические методы

```typescript
static forRoot(config: ImageProcessingConfig): DynamicModule
```

**Пример:**
```typescript
@Module({
  imports: [
    ImageProcessorModule.forRoot({
      sizes: [{ width: 320 }, { width: 640 }],
      formats: [{ type: 'webp', quality: 85 }],
      dpr: { ratios: [1, 2] }
    })
  ]
})
export class AppModule {}
```

### ImagePipelineService

Основной сервис для обработки изображений.

#### Конструктор

```typescript
constructor(
  imageProcessor: ImageProcessorService,
  @Inject(STORAGE_DRIVER) storageDriver: StorageDriver,
  config: ImageProcessingConfig
)
```

#### Методы

```typescript
// Обработка изображения
processImage(
  buffer: Buffer,
  originalFilename: string,
  mimeType?: string,
  maxSizeInBytes?: number
): Promise<ImageProcessingResult>

// Получение изображения
getImage(path: string): Promise<Buffer>

// Удаление изображения
deleteImage(path: string): Promise<void>

// Обновление конфигурации
updateConfig(config: ImageProcessingConfig): void
```

**Примеры:**

```typescript
// Обработка изображения
const result = await imagePipeline.processImage(
  file.buffer,
  file.originalname,
  file.mimetype,
  5 * 1024 * 1024 // 5MB лимит
);

// Получение изображения
const imageBuffer = await imagePipeline.getImage('/path/to/image.webp');

// Удаление изображения
await imagePipeline.deleteImage('/path/to/image.webp');
```

### ImageProcessorService

Сервис для работы с Sharp библиотекой.

#### Методы

```typescript
// Обработка изображения
processImage(
  buffer: Buffer,
  size: ImageSize,
  format: ImageFormat
): Promise<ProcessedImage>

// Получение метаданных
getImageMetadata(buffer: Buffer): Promise<sharp.Metadata>

// Валидация изображения
validateImage(buffer: Buffer): Promise<boolean>
```

**Примеры:**

```typescript
// Обработка изображения
const processed = await imageProcessor.processImage(
  buffer,
  { width: 640 },
  { type: 'webp', quality: 85 }
);

// Получение метаданных
const metadata = await imageProcessor.getImageMetadata(buffer);
console.log(`Размер: ${metadata.width}x${metadata.height}`);

// Валидация
const isValid = await imageProcessor.validateImage(buffer);
```

### ImageValidator

Утилита для валидации файлов изображений.

#### Статические методы

```typescript
// Валидация MIME типа
validateMimeType(mimeType: string): boolean

// Валидация расширения файла
validateExtension(filename: string): boolean

// Валидация размера файла
validateFileSize(buffer: Buffer, maxSize: number): boolean

// Полная валидация
validateFile(
  buffer: Buffer,
  filename: string,
  mimeType?: string,
  maxSize?: number
): void
```

**Примеры:**

```typescript
// Проверка MIME типа
const isValidMime = ImageValidator.validateMimeType('image/jpeg');

// Проверка расширения
const isValidExt = ImageValidator.validateExtension('photo.jpg');

// Полная валидация
try {
  ImageValidator.validateFile(buffer, 'photo.jpg', 'image/jpeg', 5 * 1024 * 1024);
} catch (error) {
  console.error('Файл не прошел валидацию:', error.message);
}
```

### FileNamingUtils

Утилита для генерации имен файлов.

#### Статические методы

```typescript
// Генерация имени для обработанного изображения
generateFileName(
  originalName: string,
  width: number,
  format: string,
  dpr?: number
): string

// Генерация уникального имени для оригинала
generateOriginalFileName(originalName: string): string

// Генерация пути для оригинала
generateOriginalPath(
  originalName: string,
  basePath?: string
): string
```

**Примеры:**

```typescript
// Имя для обработанного изображения
const fileName = FileNamingUtils.generateFileName('photo.jpg', 640, 'webp', 2);
// Результат: "photo_640w@2x.webp"

// Уникальное имя для оригинала
const originalName = FileNamingUtils.generateOriginalFileName('photo.jpg');
// Результат: "uuid.jpg"

// Полный путь
const path = FileNamingUtils.generateOriginalPath('photo.jpg');
// Результат: "/uploads/originals/uuid.jpg"
```

## Ошибки

### ImageProcessingError

Базовый класс для всех ошибок обработки изображений.

```typescript
class ImageProcessingError extends Error {
  constructor(message: string, cause?: Error);
}
```

### UnsupportedImageFormatError

Ошибка неподдерживаемого формата изображения.

```typescript
class UnsupportedImageFormatError extends ImageProcessingError
```

### ImageValidationError

Ошибка валидации изображения.

```typescript
class ImageValidationError extends ImageProcessingError
```

### ImageProcessingFailedError

Ошибка обработки изображения.

```typescript
class ImageProcessingFailedError extends ImageProcessingError
```

### StorageError

Ошибка работы с хранилищем.

```typescript
class StorageError extends ImageProcessingError
```

**Пример обработки ошибок:**

```typescript
try {
  await imagePipeline.processImage(buffer, filename);
} catch (error) {
  if (error instanceof ImageValidationError) {
    // Ошибка валидации
    console.error('Некорректный файл:', error.message);
  } else if (error instanceof StorageError) {
    // Ошибка хранилища
    console.error('Ошибка сохранения:', error.message);
  } else {
    // Другие ошибки
    console.error('Неизвестная ошибка:', error.message);
  }
}
```

## Константы

### STORAGE_DRIVER

Символ для инжекции драйвера хранилища.

```typescript
const STORAGE_DRIVER = Symbol('STORAGE_DRIVER');
```

**Использование:**

```typescript
@Injectable()
export class MyService {
  constructor(
    @Inject(STORAGE_DRIVER)
    private readonly storageDriver: StorageDriver
  ) {}
}
```

## Типы

### ProcessedImage

Результат обработки изображения Sharp.

```typescript
interface ProcessedImage {
  buffer: Buffer;    // Буфер обработанного изображения
  format: string;    // Формат изображения
  width: number;     // Ширина
  height: number;    // Высота
}
```

## Поддерживаемые форматы

### Входные форматы
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- AVIF (.avif)
- TIFF (.tiff, .tif)
- GIF (.gif)
- SVG (.svg)

### Выходные форматы
- WebP (рекомендуется для веб)
- AVIF (самый современный)
- JPEG (fallback для старых браузеров)
- PNG (для изображений с прозрачностью)

## Ограничения

- Максимальный размер файла: настраивается (по умолчанию 10MB)
- Поддерживаемые MIME типы: `image/*`
- Минимальный размер изображения: 1x1 пиксель
- Максимальный размер изображения: ограничен памятью системы
- DPR соотношения: любые положительные числа (рекомендуется 1-4)

## Производительность

### Рекомендуемые настройки

```typescript
// Для высокопроизводительных приложений
const config = new ImageProcessingConfig()
  .setSizes([
    { width: 320 },   // Мобильные
    { width: 640 },   // Планшеты
    { width: 1280 }   // Десктоп
  ])
  .setFormats([
    { type: 'webp', quality: 80 }
  ])
  .setDPR({ ratios: [1, 2] });

// Для максимального качества
const config = new ImageProcessingConfig()
  .setSizes([
    { width: 320 }, { width: 640 }, { width: 1024 }, { width: 1920 }
  ])
  .setFormats([
    { type: 'avif', quality: 80 },
    { type: 'webp', quality: 85 },
    { type: 'jpeg', quality: 90 }
  ])
  .setDPR({ ratios: [1, 2, 3] });
```

### Оптимизация памяти

- Используйте streaming для больших файлов
- Ограничьте количество одновременных обработок
- Настройте garbage collection для Node.js
- Используйте worker threads для CPU-интенсивных операций
