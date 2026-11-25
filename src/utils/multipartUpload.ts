export interface UploadChunk {
  index: number;
  startByte: number;
  endByte: number;
  sizeBytes: number;
}

export const DEFAULT_CHUNK_SIZE = 256 * 1024; // 256 KB
export const DEFAULT_MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export function createChunkPlan(
  totalBytes: number,
  chunkSizeBytes: number = DEFAULT_CHUNK_SIZE
): UploadChunk[] {
  if (totalBytes <= 0) {
    return [{ index: 0, startByte: 0, endByte: 0, sizeBytes: 0 }];
  }
  const safeChunkSize = Math.max(1024, chunkSizeBytes);
  const chunks: UploadChunk[] = [];
  let offset = 0;
  let index = 0;
  while (offset < totalBytes) {
    const end = Math.min(offset + safeChunkSize, totalBytes);
    chunks.push({
      index,
      startByte: offset,
      endByte: end,
      sizeBytes: end - offset,
    });
    offset = end;
    index += 1;
  }
  return chunks;
}

export interface FileValidationResult {
  valid: boolean;
  reason?: 'too-large' | 'invalid-type';
}

export function validateUploadFile(
  file: { size: number; name: string; type?: string },
  options: {
    maxFileSizeBytes?: number;
    acceptedExtensions?: string[];
  } = {}
): FileValidationResult {
  const maxBytes = options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE;
  if (file.size > maxBytes) {
    return { valid: false, reason: 'too-large' };
  }

  if (options.acceptedExtensions && options.acceptedExtensions.length > 0) {
    const lowerName = file.name.toLowerCase();
    const matchesExt = options.acceptedExtensions.some((ext) =>
      lowerName.endsWith(ext.toLowerCase())
    );
    if (!matchesExt) {
      return { valid: false, reason: 'invalid-type' };
    }
  }

  return { valid: true };
}
