import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DrawingsAttachmentService } from './drawings-attachment.service';
import * as path from 'path';
import { diskStorage } from 'multer';
import * as fs from 'fs';

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.dwg',
  '.dxf',
  '.ifc',
  '.rvt',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.PDF',
  '.DWG',
  '.DXF',
  '.IFC',
  '.RVT',
];
const MAX_DRAWINGS = parseInt(process.env.MAX_DRAWINGS || '5', 10);

@Controller('drawings')
export class DrawingsAttachmentController {
  constructor(
    private readonly drawingsAttachmentService: DrawingsAttachmentService,
  ) {}

  @Post('attachments')
  @UseInterceptors(
    FileInterceptor('files', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = './uploads/drawings';
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 15);
          const extension = path.extname(file.originalname);
          cb(null, `${timestamp}-${random}${extension}`);
        },
      }),
    }),
  )
  uploadDrawingsAttachments(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file extensions
    const extension = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      throw new BadRequestException(
        `Invalid file type: ${extension}. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`
      );
    }

    return this.drawingsAttachmentService.uploadFiles([file]);
  }
}
