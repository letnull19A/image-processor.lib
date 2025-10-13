// Main module
export { ImageProcessorModule } from './image-processor.module';

// Services
export { ImagePipelineService, STORAGE_DRIVER } from './services/image-pipeline.service';
export { ImageProcessorService } from './services/image-processor.service';

// Interfaces
export { StorageDriver } from './interfaces/storage-driver.interface';
export { 
  ImageProcessingResult, 
  ImageSize, 
  ImageFormat, 
  DPRConfig,
  ImageProcessingConfig as IImageProcessingConfig 
} from './interfaces/image-processing.interface';

// Configuration
export { ImageProcessingConfig } from './config/image-processing.config';

// Errors
export {
  ImageProcessingError,
  UnsupportedImageFormatError,
  ImageValidationError,
  ImageProcessingFailedError,
  StorageError,
} from './errors/image-processing.errors';

// Utils
export { ImageValidator } from './utils/image-validator';
export { FileNamingUtils } from './utils/file-naming.utils';
