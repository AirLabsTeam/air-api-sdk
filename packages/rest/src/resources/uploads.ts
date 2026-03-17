import type { AirBase } from "@air/api-core";
import type {
  CompleteMultipartParams,
  GetPartUploadUrlParams,
  GetPartUploadUrlResponse,
  LargeUploadResponse,
  SmallUploadResponse,
  UploadCreateParams,
  UploadCreateResponse,
  UploadFileOptions,
  UploadFileParams,
  UploadFileResponse,
} from "../types/uploads";

const _MULTIPART_THRESHOLD = 5e9; // 5GB
const DEFAULT_PART_SIZE = 100 * 1024 * 1024; // 100MB

export class Uploads {
  constructor(private client: AirBase) {}

  async create(params: UploadCreateParams): Promise<UploadCreateResponse> {
    return this.client.request<UploadCreateResponse>({
      method: "POST",
      path: "/uploads",
      body: params,
    });
  }

  async getPartUploadUrl(params: GetPartUploadUrlParams): Promise<GetPartUploadUrlResponse> {
    return this.client.request<GetPartUploadUrlResponse>({
      method: "POST",
      path: "/uploads/uploadPart",
      body: params,
    });
  }

  async completeMultipart(params: CompleteMultipartParams): Promise<void> {
    return this.client.request<void>({
      method: "POST",
      path: "/uploads/completeMultipart",
      body: params,
    });
  }

  async uploadFile(
    params: UploadFileParams,
    options: UploadFileOptions = {},
  ): Promise<UploadFileResponse> {
    const { fileData, fileName, ext, mime, size } = await resolveFileData(params);

    const uploadResponse = await this.create({
      fileName,
      ext,
      size,
      mime,
      parentBoardId: options.parentBoardId,
      assetId: options.assetId,
      customFields: options.customFields,
      tags: options.tags,
    });

    if (isSmallUpload(uploadResponse)) {
      await this._uploadSmallFile(uploadResponse.uploadUrl, fileData, options.onProgress, size);
      return { assetId: uploadResponse.assetId, versionId: uploadResponse.versionId };
    }

    await this._uploadLargeFile(uploadResponse, fileData, size, options.onProgress);
    return { assetId: uploadResponse.assetId, versionId: uploadResponse.versionId };
  }

  private async _uploadSmallFile(
    url: string,
    data: Buffer | ArrayBuffer | Uint8Array,
    onProgress?: UploadFileOptions["onProgress"],
    totalSize?: number,
  ): Promise<void> {
    const fetchFn = this.client.fetchFn;
    const response = await fetchFn(url, {
      method: "PUT",
      body: data,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    if (onProgress && totalSize) {
      onProgress({ percentage: 100, uploadedBytes: totalSize, totalBytes: totalSize });
    }
  }

  private async _uploadLargeFile(
    uploadInfo: LargeUploadResponse,
    data: Buffer | ArrayBuffer | Uint8Array,
    totalSize: number,
    onProgress?: UploadFileOptions["onProgress"],
  ): Promise<void> {
    const { multiPartUploadId, key } = uploadInfo;
    const buffer = data instanceof Buffer ? data : Buffer.from(data as ArrayLike<number>);
    const partCount = Math.ceil(totalSize / DEFAULT_PART_SIZE);
    const parts: { etag: string; partNumber: number }[] = [];
    let uploadedBytes = 0;
    const fetchFn = this.client.fetchFn;

    for (let i = 0; i < partCount; i++) {
      const partNumber = i + 1;
      const start = i * DEFAULT_PART_SIZE;
      const end = Math.min(start + DEFAULT_PART_SIZE, totalSize);
      const chunk = buffer.subarray(start, end);

      const { url } = await this.getPartUploadUrl({
        multiPartUploadId,
        key,
        partNumber,
      });

      const response = await fetchFn(url, {
        method: "PUT",
        body: chunk,
      });

      if (!response.ok) {
        throw new Error(`Part ${partNumber} upload failed with status ${response.status}`);
      }

      const etag = response.headers.get("etag");
      if (!etag) {
        throw new Error(`Part ${partNumber} upload did not return an ETag`);
      }

      parts.push({ etag, partNumber });
      uploadedBytes += chunk.byteLength;

      if (onProgress) {
        onProgress({
          percentage: Math.round((uploadedBytes / totalSize) * 100),
          uploadedBytes,
          totalBytes: totalSize,
        });
      }
    }

    await this.completeMultipart({ multiPartUploadId, key, parts });
  }
}

function isSmallUpload(response: UploadCreateResponse): response is SmallUploadResponse {
  return "uploadUrl" in response;
}

async function resolveFileData(params: UploadFileParams): Promise<{
  fileData: Buffer | ArrayBuffer | Uint8Array;
  fileName: string;
  ext: string;
  mime: string;
  size: number;
}> {
  if (params.filePath) {
    const fs = await import("fs");
    const path = await import("path");
    const fileData = fs.readFileSync(params.filePath);
    const parsed = path.parse(params.filePath);
    const fileName = params.fileName ?? parsed.name;
    const ext = params.ext ?? parsed.ext.replace(/^\./, "");
    const mime = params.mime ?? guessMime(ext);
    return { fileData, fileName, ext, mime, size: fileData.byteLength };
  }

  if (params.buffer) {
    const data =
      params.buffer instanceof Buffer
        ? params.buffer
        : Buffer.from(params.buffer as ArrayLike<number>);
    if (!params.fileName || !params.ext) {
      throw new Error("fileName and ext are required when uploading from a buffer");
    }
    const mime = params.mime ?? guessMime(params.ext);
    return {
      fileData: data,
      fileName: params.fileName,
      ext: params.ext,
      mime,
      size: data.byteLength,
    };
  }

  if (params.file) {
    const arrayBuffer = await params.file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const name = params.file.name;
    const dotIndex = name.lastIndexOf(".");
    const fileName = params.fileName ?? (dotIndex > 0 ? name.substring(0, dotIndex) : name);
    const ext = params.ext ?? (dotIndex > 0 ? name.substring(dotIndex + 1) : "");
    const mime = params.mime ?? (params.file.type || guessMime(ext));
    return { fileData: data, fileName, ext, mime, size: data.byteLength };
  }

  throw new Error("One of filePath, buffer, or file must be provided");
}

function guessMime(ext: string): string {
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    webm: "video/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    zip: "application/zip",
    psd: "image/vnd.adobe.photoshop",
    ai: "application/postscript",
    eps: "application/postscript",
    tif: "image/tiff",
    tiff: "image/tiff",
    bmp: "image/bmp",
  };
  return mimeMap[ext.toLowerCase()] ?? "application/octet-stream";
}
