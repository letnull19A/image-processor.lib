import { Module, DynamicModule } from '@nestjs/common';
import { ImagePipelineService, STORAGE_DRIVER } from './services/image-pipeline.service';
import { ImageProcessorService } from './services/image-processor.service';
import { ImageProcessingConfig } from './config/image-processing.config';
import { StorageDriver } from './interfaces/storage-driver.interface';

export interface ImageProcessorModuleOptions {
  storageDriver: StorageDriver;
  config?: ImageProcessingConfig;
}

@Module({})
export class ImageProcessorModule {
  static forRoot(options: ImageProcessorModuleOptions): DynamicModule {
    return {
      module: ImageProcessorModule,
      providers: [
        {
          provide: STORAGE_DRIVER,
          useValue: options.storageDriver,
        },
        {
          provide: ImageProcessingConfig,
          useValue: options.config || new ImageProcessingConfig(),
        },
        ImageProcessorService,
        ImagePipelineService,
      ],
      exports: [
        ImagePipelineService,
        ImageProcessorService,
        ImageProcessingConfig,
      ],
    };
  }
}
