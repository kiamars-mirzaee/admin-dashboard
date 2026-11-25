import test from 'node:test';
import assert from 'node:assert/strict';
import { createChunkPlan, validateUploadFile } from './multipartUpload';

test('createChunkPlan splits payloads into contiguous byte ranges including partial tail chunk', () => {
  const chunks = createChunkPlan(600_000, 256 * 1024);
  assert.equal(chunks.length, 3);
  assert.deepEqual(chunks[0], { index: 0, startByte: 0, endByte: 262144, sizeBytes: 262144 });
  assert.deepEqual(chunks[1], { index: 1, startByte: 262144, endByte: 524288, sizeBytes: 262144 });
  assert.deepEqual(chunks[2], { index: 2, startByte: 524288, endByte: 600000, sizeBytes: 75712 });

  const sumBytes = chunks.reduce((acc, c) => acc + c.sizeBytes, 0);
  assert.equal(sumBytes, 600_000);
});

test('validateUploadFile enforces maximum size and allowed extensions', () => {
  assert.deepEqual(
    validateUploadFile({ name: 'report.pdf', size: 1024 * 500 }, { maxFileSizeBytes: 1024 * 1024, acceptedExtensions: ['.pdf', '.csv'] }),
    { valid: true }
  );

  assert.deepEqual(
    validateUploadFile({ name: 'huge.zip', size: 5 * 1024 * 1024 }, { maxFileSizeBytes: 2 * 1024 * 1024 }),
    { valid: false, reason: 'too-large' }
  );

  assert.deepEqual(
    validateUploadFile({ name: 'script.exe', size: 1024 }, { acceptedExtensions: ['.pdf', '.csv'] }),
    { valid: false, reason: 'invalid-type' }
  );
});
