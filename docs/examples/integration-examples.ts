// Примеры интеграции с различными фреймворками и сервисами

import { 
  ImageProcessorModule, 
  ImagePipelineService,
  ImageProcessingConfig,
  StorageDriver,
  STORAGE_DRIVER
} from '../src';

// 1. Интеграция с GraphQL
import { Resolver, Mutation, Arg, ObjectType, Field } from '@nestjs/graphql';
import { GraphQLUpload } from 'graphql-upload';

@ObjectType()
export class ImageUploadResult {
  @Field()
  original: string;

  @Field(() => [String])
  webpVariants: string[];

  @Field(() => [String])
  avifVariants: string[];

  @Field()
  totalVariants: number;
}

@Resolver()
export class ImageGraphQLResolver {
  constructor(
    private readonly imagePipeline: ImagePipelineService
  ) {}

  @Mutation(() => ImageUploadResult)
  async uploadImage(
    @Arg('file', () => GraphQLUpload) file: any
  ): Promise<ImageUploadResult> {
    const { createReadStream, filename, mimetype } = await file;
    
    // Читаем поток в буфер
    const chunks = [];
    const stream = createReadStream();
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    
    // Обрабатываем изображение
    const result = await this.imagePipeline.processImage(
      buffer,
      filename,
      mimetype
    );
    
    return {
      original: result.original,
      webpVariants: result.generated.webp || [],
      avifVariants: result.generated.avif || [],
      totalVariants: Object.values(result.generated)
        .reduce((total, variants) => total + variants.length, 0)
    };
  }
}

// 2. Интеграция с Bull Queue для фоновой обработки
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

interface ImageProcessingJob {
  buffer: Buffer;
  filename: string;
  mimetype?: string;
  userId: string;
  configType: string;
}

@Processor('image-processing')
export class ImageProcessingQueue {
  constructor(
    private readonly imagePipeline: ImagePipelineService
  ) {}

  @Process('process-image')
  async processImage(job: Job<ImageProcessingJob>) {
    const { buffer, filename, mimetype, userId, configType } = job.data;
    
    try {
      // Обновляем прогресс
      job.progress(10);
      
      // Обрабатываем изображение
      const result = await this.imagePipeline.processImage(
        buffer,
        filename,
        mimetype
      );
      
      job.progress(90);
      
      // Сохраняем результат в базе данных
      // await this.saveImageResult(userId, result);
      
      job.progress(100);
      
      return {
        success: true,
        result,
        userId
      };
    } catch (error) {
      job.progress(100);
      throw new Error(`Ошибка обработки изображения: ${error.message}`);
    }
  }
}

// 3. Интеграция с AWS S3
import { S3 } from 'aws-sdk';

export class S3StorageDriver implements StorageDriver {
  private s3: S3;

  constructor(
    private bucket: string,
    private region: string = 'us-east-1'
  ) {
    this.s3 = new S3({
      region: this.region,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
  }

  async upload(path: string, data: Buffer): Promise<string> {
    const result = await this.s3.upload({
      Bucket: this.bucket,
      Key: path,
      Body: data,
      ContentType: this.getContentType(path),
      ACL: 'public-read',
      CacheControl: 'max-age=31536000' // 1 год кэширования
    }).promise();
    
    return result.Location;
  }

  async download(path: string): Promise<Buffer> {
    const key = this.extractKeyFromUrl(path);
    const result = await this.s3.getObject({
      Bucket: this.bucket,
      Key: key
    }).promise();
    
    return result.Body as Buffer;
  }

  async delete(path: string): Promise<void> {
    const key = this.extractKeyFromUrl(path);
    await this.s3.deleteObject({
      Bucket: this.bucket,
      Key: key
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

  private extractKeyFromUrl(url: string): string {
    // Извлекаем ключ из S3 URL
    const urlParts = url.split('/');
    return urlParts.slice(3).join('/'); // Убираем https://bucket.s3.region.amazonaws.com/
  }
}

// 4. Интеграция с Cloudinary
import { v2 as cloudinary } from 'cloudinary';

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
      { 
        public_id: publicId,
        folder: 'images',
        resource_type: 'image'
      }
    );
    
    return result.secure_url;
  }

  async download(path: string): Promise<Buffer> {
    const publicId = this.extractPublicId(path);
    const url = cloudinary.url(publicId, { secure: true });
    
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async delete(path: string): Promise<void> {
    const publicId = this.extractPublicId(path);
    await cloudinary.uploader.destroy(publicId);
  }

  private getFormat(path: string): string {
    return path.split('.').pop()?.toLowerCase() || 'jpg';
  }

  private extractPublicId(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
  }
}

// 5. Интеграция с Redis для кэширования
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisCachedImageService {
  constructor(
    private readonly imagePipeline: ImagePipelineService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getCachedImage(path: string): Promise<Buffer> {
    const cacheKey = `image:${path}`;
    
    let imageBuffer = await this.cacheManager.get<Buffer>(cacheKey);
    
    if (!imageBuffer) {
      imageBuffer = await this.imagePipeline.getImage(path);
      
      // Кэшируем на 1 час
      await this.cacheManager.set(cacheKey, imageBuffer, 3600);
    }
    
    return imageBuffer;
  }

  async invalidateCache(path: string): Promise<void> {
    const cacheKey = `image:${path}`;
    await this.cacheManager.del(cacheKey);
  }
}

// 6. Интеграция с Prisma ORM
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

interface ImageRecord {
  id: string;
  originalPath: string;
  variants: any;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ImageDatabaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imagePipeline: ImagePipelineService
  ) {}

  async saveImageResult(
    userId: string,
    result: any,
    metadata?: any
  ): Promise<ImageRecord> {
    return this.prisma.image.create({
      data: {
        originalPath: result.original,
        variants: result.generated,
        userId,
        metadata: metadata || {}
      }
    });
  }

  async getUserImages(userId: string): Promise<ImageRecord[]> {
    return this.prisma.image.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async deleteImageRecord(imageId: string): Promise<void> {
    const image = await this.prisma.image.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      throw new Error('Изображение не найдено');
    }

    // Удаляем файлы из хранилища
    await this.imagePipeline.deleteImage(image.originalPath);
    
    // Удаляем варианты
    for (const format in image.variants) {
      for (const variant of image.variants[format]) {
        await this.imagePipeline.deleteImage(variant);
      }
    }

    // Удаляем запись из базы
    await this.prisma.image.delete({
      where: { id: imageId }
    });
  }
}

// 7. Интеграция с WebSocket для real-time обновлений
import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*'
  }
})
export class ImageProcessingGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('image-processing-start')
  async handleImageProcessingStart(client: any, data: { userId: string; filename: string }) {
    // Уведомляем клиента о начале обработки
    client.emit('image-processing-progress', {
      userId: data.userId,
      filename: data.filename,
      progress: 0,
      status: 'started'
    });
  }

  @SubscribeMessage('image-processing-progress')
  async handleImageProcessingProgress(client: any, data: { userId: string; progress: number }) {
    // Отправляем прогресс обработки
    this.server.emit('image-processing-progress', {
      userId: data.userId,
      progress: data.progress,
      status: 'processing'
    });
  }

  @SubscribeMessage('image-processing-complete')
  async handleImageProcessingComplete(client: any, data: { userId: string; result: any }) {
    // Уведомляем о завершении
    this.server.emit('image-processing-complete', {
      userId: data.userId,
      result: data.result,
      status: 'completed'
    });
  }

  @SubscribeMessage('image-processing-error')
  async handleImageProcessingError(client: any, data: { userId: string; error: string }) {
    // Уведомляем об ошибке
    this.server.emit('image-processing-error', {
      userId: data.userId,
      error: data.error,
      status: 'failed'
    });
  }
}

// 8. Интеграция с Multer для загрузки файлов
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

// Кастомная конфигурация Multer
export const multerConfig = {
  storage: diskStorage({
    destination: './temp',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|webp|avif)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый формат файла'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
};

// 9. Интеграция с Swagger для документации API
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { Body, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Images')
export class ImageSwaggerController {
  constructor(
    private readonly imagePipeline: ImagePipelineService
  ) {}

  @ApiOperation({ summary: 'Загрузка изображения' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Изображение успешно обработано' })
  @ApiResponse({ status: 400, description: 'Некорректный файл' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('images', 10, multerConfig))
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    const results = [];
    
    for (const file of files) {
      const result = await this.imagePipeline.processImage(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      results.push(result);
    }
    
    return {
      success: true,
      results,
      totalFiles: files.length
    };
  }
}

// 10. Полная интеграция с модулем
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    // Основной модуль обработки изображений
    ImageProcessorModule.forRoot({
      sizes: [
        { width: 320 },
        { width: 640 },
        { width: 1024 },
        { width: 1920 }
      ],
      formats: [
        { type: 'webp', quality: 85 },
        { type: 'avif', quality: 80 },
        { type: 'jpeg', quality: 90 }
      ],
      dpr: { ratios: [1, 2, 3] }
    }),
    
    // Очередь для фоновой обработки
    BullModule.registerQueue({
      name: 'image-processing'
    }),
    
    // Кэширование
    CacheModule.register({
      ttl: 3600, // 1 час
      max: 1000  // Максимум 1000 записей
    }),
    
    // Multer для загрузки файлов
    MulterModule.register(multerConfig)
  ],
  providers: [
    // Storage драйвер
    {
      provide: STORAGE_DRIVER,
      useClass: S3StorageDriver // или CloudinaryStorageDriver
    },
    
    // Сервисы
    ImageProcessingQueue,
    RedisCachedImageService,
    ImageDatabaseService,
    ImageGraphQLResolver
  ],
  controllers: [
    ImageSwaggerController
  ],
  exports: [
    ImagePipelineService
  ]
})
export class IntegratedImageModule {}
