export class ImageProcessingError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

export class UnsupportedImageFormatError extends ImageProcessingError {
  constructor(format: string) {
    super(`Unsupported image format: ${format}`, 'UNSUPPORTED_FORMAT');
  }
}

export class ImageValidationError extends ImageProcessingError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class ImageProcessingFailedError extends ImageProcessingError {
  constructor(message: string, public readonly originalError?: Error) {
    super(message, 'PROCESSING_FAILED');
  }
}

export class StorageError extends ImageProcessingError {
  constructor(message: string, public readonly originalError?: Error) {
    super(message, 'STORAGE_ERROR');
  }
}
