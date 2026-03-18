import { describe, expect, test, vi } from "vitest";
import { AirApi } from "../../src/api";
import { createMockFetch, createClientOptions } from "../helpers/mock-fetch";

describe("Uploads", () => {
  test("create sends POST with upload params", async () => {
    const response = {
      assetId: "asset-1",
      versionId: "v1",
      uploadUrl: "https://s3.example.com/upload",
    };
    const mockFetch = createMockFetch({ status: 201, body: response });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.uploads.create({
      fileName: "photo",
      ext: "jpg",
      size: 1024,
      mime: "image/jpeg",
    });
    expect(result).toEqual(response);
    expect(mockFetch.calls[0].init?.method).toBe("POST");
  });

  test("getPartUploadUrl sends POST", async () => {
    const response = { url: "https://s3.example.com/part1" };
    const mockFetch = createMockFetch({ body: response });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.uploads.getPartUploadUrl({
      multiPartUploadId: "mp-1",
      key: "key-1",
      partNumber: 1,
    });
    expect(result.url).toBe("https://s3.example.com/part1");
    expect(mockFetch.calls[0].url).toContain("/uploads/uploadPart");
  });

  test("completeMultipart sends POST", async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.uploads.completeMultipart({
      multiPartUploadId: "mp-1",
      key: "key-1",
      parts: [{ etag: '"abc"', partNumber: 1 }],
    });
    expect(mockFetch.calls[0].url).toContain("/uploads/completeMultipart");
  });

  test("uploadFile handles small file upload", async () => {
    const createResponse = {
      assetId: "asset-1",
      versionId: "v1",
      uploadUrl: "https://s3.example.com/upload",
    };

    const mockFetch = createMockFetch([{ status: 201, body: createResponse }, { status: 200 }]);
    const client = new AirApi(createClientOptions(mockFetch));

    const progressEvents: number[] = [];
    const result = await client.uploads.uploadFile(
      {
        buffer: Buffer.from("hello world"),
        fileName: "test",
        ext: "txt",
        mime: "text/plain",
      },
      {
        parentBoardId: "board-1",
        onProgress: ({ percentage }) => progressEvents.push(percentage),
      },
    );

    expect(result.assetId).toBe("asset-1");
    expect(result.versionId).toBe("v1");
    expect(progressEvents).toContain(100);

    // First call is the create, second is the PUT upload
    expect(mockFetch.calls[0].url).toContain("/uploads");
    expect(mockFetch.calls[1].url).toBe("https://s3.example.com/upload");
    expect(mockFetch.calls[1].init?.method).toBe("PUT");
  });

  test("uploadFile with filePath uses statSync for size (small upload)", async () => {
    const fs = await import("fs");
    const os = await import("os");
    const path = await import("path");

    const tmpFile = path.join(os.tmpdir(), `air-test-${Date.now()}.txt`);
    const content = "small file content for testing";
    fs.writeFileSync(tmpFile, content);

    try {
      const createResponse = {
        assetId: "asset-1",
        versionId: "v1",
        uploadUrl: "https://s3.example.com/upload",
      };

      const mockFetch = createMockFetch([{ status: 201, body: createResponse }, { status: 200 }]);
      const client = new AirApi(createClientOptions(mockFetch));

      const result = await client.uploads.uploadFile({ filePath: tmpFile });

      expect(result.assetId).toBe("asset-1");
      expect(result.versionId).toBe("v1");

      // Verify the create call received the correct size from statSync
      const createCall = mockFetch.calls[0];
      const body = JSON.parse(createCall.init?.body as string);
      expect(body.size).toBe(Buffer.byteLength(content));
      expect(body.ext).toBe("txt");
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  test("uploadFile large file with buffer uses subarray chunking", async () => {
    const totalSize = 250 * 1024 * 1024;
    const buffer = Buffer.alloc(totalSize);

    const createResponse = {
      assetId: "asset-1",
      versionId: "v1",
      multiPartUploadId: "mp-1",
      key: "key-1",
    };

    const partUrlResponse = { url: "https://s3.example.com/part" };

    const mockFetch = createMockFetch([
      { status: 201, body: createResponse },
      { body: partUrlResponse },
      { status: 200, headers: { etag: '"etag1"' } },
      { body: partUrlResponse },
      { status: 200, headers: { etag: '"etag2"' } },
      { body: partUrlResponse },
      { status: 200, headers: { etag: '"etag3"' } },
      { status: 204 },
    ]);
    const client = new AirApi(createClientOptions(mockFetch));

    const progressEvents: { percentage: number; uploadedBytes: number }[] = [];
    const result = await client.uploads.uploadFile(
      { buffer, fileName: "big", ext: "bin" },
      { onProgress: (p) => progressEvents.push({ percentage: p.percentage, uploadedBytes: p.uploadedBytes }) },
    );

    expect(result.assetId).toBe("asset-1");

    // Verify progress callbacks fired for each part
    expect(progressEvents).toHaveLength(3);
    expect(progressEvents[0].percentage).toBe(40);
    expect(progressEvents[1].percentage).toBe(80);
    expect(progressEvents[2].percentage).toBe(100);

    // Verify completeMultipart was called
    const lastCall = mockFetch.calls[mockFetch.calls.length - 1];
    expect(lastCall.url).toContain("/uploads/completeMultipart");
  });
});

describe("Uploads - filePath streaming", () => {
  test("large file with filePath streams chunks via readSync", async () => {
    const totalSize = 250 * 1024 * 1024; // 250MB → 3 parts
    const partSize = 100 * 1024 * 1024;

    const mockStatSync = vi.fn().mockReturnValue({ size: totalSize });
    const mockOpenSync = vi.fn().mockReturnValue(42);
    const mockReadSync = vi.fn().mockReturnValue(0);
    const mockCloseSync = vi.fn();

    // Use vi.doMock for dynamic import mocking
    vi.doMock("fs", () => ({
      statSync: mockStatSync,
      openSync: mockOpenSync,
      readSync: mockReadSync,
      closeSync: mockCloseSync,
      readFileSync: vi.fn(),
    }));

    // Re-import to pick up the mock
    const { Uploads } = await import("../../src/resources/uploads");

    const createResponse = {
      assetId: "asset-1",
      versionId: "v1",
      multiPartUploadId: "mp-1",
      key: "key-1",
    };

    const partUrlResponse = { url: "https://s3.example.com/part" };

    const mockFetch = createMockFetch([
      { status: 201, body: createResponse },
      { body: partUrlResponse },
      { status: 200, headers: { etag: '"etag1"' } },
      { body: partUrlResponse },
      { status: 200, headers: { etag: '"etag2"' } },
      { body: partUrlResponse },
      { status: 200, headers: { etag: '"etag3"' } },
      { status: 204 },
    ]);
    const client = new AirApi(createClientOptions(mockFetch));

    // Replace the uploads instance with one using re-imported module
    const uploads = new Uploads(client as any);

    const progressEvents: { percentage: number; uploadedBytes: number }[] = [];
    const result = await uploads.uploadFile(
      { filePath: "/tmp/large-video.mp4" },
      { onProgress: (p) => progressEvents.push({ percentage: p.percentage, uploadedBytes: p.uploadedBytes }) },
    );

    expect(result.assetId).toBe("asset-1");
    expect(result.versionId).toBe("v1");

    // Verify streaming: openSync/readSync/closeSync were used
    expect(mockOpenSync).toHaveBeenCalledWith("/tmp/large-video.mp4", "r");
    expect(mockReadSync).toHaveBeenCalledTimes(3);

    // Verify chunk sizes
    expect(mockReadSync).toHaveBeenNthCalledWith(1, 42, expect.any(Buffer), 0, partSize, 0);
    expect(mockReadSync).toHaveBeenNthCalledWith(2, 42, expect.any(Buffer), 0, partSize, partSize);
    expect(mockReadSync).toHaveBeenNthCalledWith(
      3,
      42,
      expect.any(Buffer),
      0,
      totalSize - 2 * partSize,
      2 * partSize,
    );

    expect(mockCloseSync).toHaveBeenCalledWith(42);

    // Verify progress events
    expect(progressEvents).toHaveLength(3);
    expect(progressEvents[0].percentage).toBe(40);
    expect(progressEvents[1].percentage).toBe(80);
    expect(progressEvents[2].percentage).toBe(100);

    // Verify completeMultipart was called
    const lastCall = mockFetch.calls[mockFetch.calls.length - 1];
    expect(lastCall.url).toContain("/uploads/completeMultipart");

    vi.doUnmock("fs");
  });
});
