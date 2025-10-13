import { promises as fs } from 'fs';
import { join } from 'path';
import { 
  ImageProcessorModule, 
  StorageDriver, 
  ImageProcessingConfig,
  ImageSize,
  ImageFormat 
} from './src';

// Example implementation of StorageDriver for local file system
export class LocalStorageDriver implements StorageDriver {
  constructor(private baseDir: string = './uploads') {}

  async upload(path: string, data: Buffer): Promise<string> {
    const fullPath = join(this.baseDir, path);
    await fs.mkdir(join(fullPath, '..'), { recursive: true });
    await fs.writeFile(fullPath, data);
    return path; // Return relative path
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

// Example usage
async function example() {
  // Configure image processing with DPR support
  const config = new ImageProcessingConfig()
    .setSizes([
      { width: 320 },
      { width: 640 },
      { width: 1024 }
    ])
    .setFormats([
      { type: 'webp', quality: 85 },
      { type: 'avif', quality: 80 }
    ])
    .setDPR({ ratios: [1, 2, 3] }); // Support for 1x, 2x, 3x displays

  // Create storage driver
  const storageDriver = new LocalStorageDriver('./uploads');

  // Example result structure with DPR support:
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

export { LocalStorageDriver };
