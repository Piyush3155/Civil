import { Injectable } from '@nestjs/common';

@Injectable()
export class DrawingsAttachmentService {
  // Service methods can be added here if needed for business logic
  // Currently, all logic is handled in the controller for simplicity

  uploadFiles(files: any[]) {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      // The file is already saved by multer diskStorage
      // file.filename contains the generated filename
      // file.path contains the full path
      const fileUrl = `/uploads/drawings/${file.filename}`;
      uploadedUrls.push(fileUrl);
    }

    return {
      success: true,
      data: { attachmentUrls: uploadedUrls },
      message: 'Drawings uploaded successfully',
    };
  }
}