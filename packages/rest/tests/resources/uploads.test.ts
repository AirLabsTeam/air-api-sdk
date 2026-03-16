import { describe, expect, test } from 'bun:test';
import { AirApi } from '../../src/api';
import { createMockFetch, createClientOptions } from '../helpers/mock-fetch';

describe('Uploads', () => {
  test('create sends POST with upload params', async () => {
    const response = {
      assetId: 'asset-1',
      versionId: 'v1',
      uploadUrl: 'https://s3.example.com/upload',
    };
    const mockFetch = createMockFetch({ status: 201, body: response });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.uploads.create({
      fileName: 'photo',
      ext: 'jpg',
      size: 1024,
      mime: 'image/jpeg',
    });
    expect(result).toEqual(response);
    expect(mockFetch.calls[0].init?.method).toBe('POST');
  });

  test('getPartUploadUrl sends POST', async () => {
    const response = { url: 'https://s3.example.com/part1' };
    const mockFetch = createMockFetch({ body: response });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.uploads.getPartUploadUrl({
      multiPartUploadId: 'mp-1',
      key: 'key-1',
      partNumber: 1,
    });
    expect(result.url).toBe('https://s3.example.com/part1');
    expect(mockFetch.calls[0].url).toContain('/uploads/uploadPart');
  });

  test('completeMultipart sends POST', async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.uploads.completeMultipart({
      multiPartUploadId: 'mp-1',
      key: 'key-1',
      parts: [{ etag: '"abc"', partNumber: 1 }],
    });
    expect(mockFetch.calls[0].url).toContain('/uploads/completeMultipart');
  });

  test('uploadFile handles small file upload', async () => {
    const createResponse = {
      assetId: 'asset-1',
      versionId: 'v1',
      uploadUrl: 'https://s3.example.com/upload',
    };

    const mockFetch = createMockFetch([
      { status: 201, body: createResponse },
      { status: 200 },
    ]);
    const client = new AirApi(createClientOptions(mockFetch));

    const progressEvents: number[] = [];
    const result = await client.uploads.uploadFile(
      {
        buffer: Buffer.from('hello world'),
        fileName: 'test',
        ext: 'txt',
        mime: 'text/plain',
      },
      {
        parentBoardId: 'board-1',
        onProgress: ({ percentage }) => progressEvents.push(percentage),
      },
    );

    expect(result.assetId).toBe('asset-1');
    expect(result.versionId).toBe('v1');
    expect(progressEvents).toContain(100);

    // First call is the create, second is the PUT upload
    expect(mockFetch.calls[0].url).toContain('/uploads');
    expect(mockFetch.calls[1].url).toBe('https://s3.example.com/upload');
    expect(mockFetch.calls[1].init?.method).toBe('PUT');
  });
});
