import { Module } from '@nestjs/common';
import { 
  ImageProcessorModule, 
  ImagePipelineService, 
  ImageProcessingConfig,
  StorageDriver,
  STORAGE_DRIVER,
  ImageProcessingResult 
} from '../src';
import { promises as fs } from 'fs';
import { join } from 'path';

// 1. Реализация простого локального хранилища
class LocalStorageDriver implements StorageDriver {
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

// 2. Конфигурация модуля
@Module({
  imports: [
    ImageProcessorModule.forRoot({
      sizes: [
        { width: 320 },   // Мобильные устройства
        { width: 640 },   // Планшеты
        { width: 1024 }   // Десктоп
      ],
      formats: [
        { type: 'webp', quality: 85 },
        { type: 'avif', quality: 80 }
      ],
      dpr: { ratios: [1, 2, 3] } // 1x, 2x, 3x дисплеи
    })
  ],
  providers: [
    {
      provide: STORAGE_DRIVER,
      useClass: LocalStorageDriver
    }
  ]
})
export class BasicAppModule {}

// 3. Сервис для работы с изображениями
import { Injectable } from '@nestjs/common';

@Injectable()
export class ImageService {
  constructor(
    private readonly imagePipeline: ImagePipelineService
  ) {}

  async uploadImage(
    buffer: Buffer, 
    originalName: string, 
    mimeType?: string
  ): Promise<ImageProcessingResult> {
    try {
      // Обрабатываем изображение
      const result = await this.imagePipeline.processImage(
        buffer,
        originalName,
        mimeType,
        5 * 1024 * 1024 // 5MB лимит
      );

      console.log('Обработка завершена:');
      console.log('Оригинал:', result.original);
      console.log('Варианты:', result.generated);

      return result;
    } catch (error) {
      console.error('Ошибка обработки изображения:', error.message);
      throw error;
    }
  }

  async getImage(path: string): Promise<Buffer> {
    return this.imagePipeline.getImage(path);
  }

  async deleteImage(path: string): Promise<void> {
    await this.imagePipeline.deleteImage(path);
  }
}

// 4. Контроллер для API
import { Controller, Post, Get, Delete, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const result = await this.imageService.uploadImage(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    return {
      success: true,
      data: {
        original: result.original,
        variants: result.generated,
        totalVariants: Object.values(result.generated)
          .reduce((total, variants) => total + variants.length, 0)
      }
    };
  }

  @Get(':path(*)')
  async getImage(@Param('path') path: string) {
    const buffer = await this.imageService.getImage(`/${path}`);
    return buffer;
  }

  @Delete(':path(*)')
  async deleteImage(@Param('path') path: string) {
    await this.imageService.deleteImage(`/${path}`);
    return { success: true, message: 'Изображение удалено' };
  }
}

// 5. Пример использования в main.ts
async function bootstrap() {
  const app = await NestFactory.create(BasicAppModule);
  
  // Настройка CORS для работы с фронтендом
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  });

  await app.listen(3000);
  console.log('Сервер запущен на http://localhost:3000');
}

// 6. Пример клиентского кода (JavaScript)
/*
// Загрузка изображения
const formData = new FormData();
formData.append('image', fileInput.files[0]);

fetch('/images/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Загружено:', data);
  
  // Показать все варианты изображения
  const variants = data.data.variants;
  Object.keys(variants).forEach(format => {
    variants[format].forEach(variant => {
      const img = document.createElement('img');
      img.src = `/images/${variant}`;
      img.alt = `${format} - ${variant}`;
      document.body.appendChild(img);
    });
  });
});

// Получение изображения
fetch('/images/path/to/image.webp')
  .then(response => response.blob())
  .then(blob => {
    const url = URL.createObjectURL(blob);
    const img = document.createElement('img');
    img.src = url;
    document.body.appendChild(img);
  });
*/
