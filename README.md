# Image Processor Library

A library for efficient image processing in the browser with support for modern formats (WebP, AVIF) and adaptive sizes for mobile devices.

## Features

- ✅ Support for modern image formats (WebP, AVIF)
- ✅ Automatic generation of adaptive sizes for `srcset`
- ✅ **DPR (Device Pixel Ratio) support** for Retina displays
- ✅ File upload validation
- ✅ Custom error classes
- ✅ Flexible configuration of sizes, formats, and DPR
- ✅ Support for various storage drivers
- ✅ Full TypeScript typing
- ✅ Unit tests with Vitest

## Tech Stack

- **TypeScript** - typing
- **NestJS** - modular architecture
- **Sharp** - image processing
- **Multer** - file uploads
- **UUID v7** - unique filename generation

## Installation

```bash
npm install image-processor-lib
```

## Quick Start

### 1. Create a storage driver

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

### 2. Configure the module

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

### 3. Use in service

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
    // Result with DPR support:
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

Main service for image processing.

#### `processImage(buffer, filename, mimeType?, maxSize?)`

Processes an image and creates adaptive versions.

**Parameters:**
- `buffer: Buffer` - image buffer
- `filename: string` - filename
- `mimeType?: string` - MIME type (optional)
- `maxSize?: number` - maximum size in bytes (optional)

**Returns:** `Promise<ImageProcessingResult>`

#### `deleteImage(path)`

Deletes an image from storage.

#### `getImage(path)`

Gets an image from storage.

### ImageProcessingConfig

Class for configuring image processing.

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

The library supports creating images for different pixel densities:

- **1x** - standard displays
- **2x** - Retina displays (iPhone, MacBook)
- **3x** - Super Retina displays (iPhone Pro)

This allows creating crisp images for all device types:

```typescript
// For 320px size with DPR support, the following are created:
// - pic_320w@1x.webp (320px)
// - pic_320w@2x.webp (640px) 
// - pic_320w@3x.webp (960px)
```

### Supported Formats

**Input formats:**
- JPEG/JPG
- PNG
- WebP
- AVIF
- GIF
- BMP
- TIFF
- SVG

**Output formats:**
- WebP
- AVIF
- JPEG
- PNG

## Error Handling

The library provides specialized error classes:

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
    // Handle unsupported format
  } else if (error instanceof ImageValidationError) {
    // Validation error
  } else if (error instanceof StorageError) {
    // Storage error
  }
}
```

## Testing

```bash
npm test
npm run test:coverage
```

## Documentation

📚 **[Complete Documentation](./docs/README.md)** - All materials in one place

### Main documents:
- [**Usage Guide**](./docs/USAGE_GUIDE.md) - Complete guide with code examples
- [**API Reference**](./docs/API_REFERENCE.md) - Documentation of all interfaces and methods
- [**Usage Examples**](./docs/examples/) - Practical integration examples

### Main documentation sections:

- 🚀 **Quick Start** - Setup in 5 minutes
- ⚙️ **Configuration** - Flexible settings for sizes, formats, and DPR
- 🔧 **Storage Drivers** - AWS S3, Cloudinary, local storage
- 📱 **DPR Support** - Retina displays and adaptive images
- 🛠️ **Integration** - NestJS, GraphQL, Bull Queue, Redis
- 🎯 **Best Practices** - Performance optimization
- ❌ **Error Handling** - Specialized error classes

### Code examples:

```typescript
// Basic setup
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

// Image processing
const result = await imagePipeline.processImage(
  file.buffer,
  file.originalname,
  file.mimetype
);

// Result with DPR support:
// {
//   "original": "/uploads/originals/uuid.jpg",
//   "generated": {
//     "webp": ["image_320w@1x.webp", "image_320w@2x.webp", "image_320w@3x.webp"],
//     "avif": ["image_320w@1x.avif", "image_320w@2x.avif", "image_320w@3x.avif"]
//   }
// }
```

## License

MIT
