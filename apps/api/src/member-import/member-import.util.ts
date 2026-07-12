import { BadRequestException } from '@nestjs/common';

/**
 * Minimal shape of a memory-storage multer file. Declared locally because the
 * project does not depend on @types/multer.
 */
export interface UploadedCsvFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/**
 * Validates an uploaded CSV (presence, extension/mime, non-empty) and returns
 * its UTF-8 text. Shared by the student and parent bulk-import endpoints.
 */
export function readCsvUpload(file?: UploadedCsvFile): string {
  if (!file) {
    throw new BadRequestException(
      'A CSV file is required (multipart form field "file").',
    );
  }

  const name = file.originalname?.toLowerCase() ?? '';
  const isCsv =
    name.endsWith('.csv') ||
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.ms-excel';
  if (!isCsv) {
    throw new BadRequestException('Only .csv files are accepted.');
  }

  const content = file.buffer.toString('utf-8');
  if (!content.trim()) {
    throw new BadRequestException('The CSV file is empty.');
  }

  return content;
}
