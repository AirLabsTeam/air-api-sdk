export interface UploadCreateParams {
  fileName: string;
  ext: string;
  size: number;
  mime: string;
  recordedAt?: string;
  parentBoardId?: string;
  assetId?: string;
  customFields?: {
    id: string;
    value?: string | null;
    values?: { id: string }[] | null;
  }[] | null;
  tags?: { id: string }[] | null;
}

export interface SmallUploadResponse {
  assetId: string;
  versionId: string;
  uploadUrl: string;
}

export interface LargeUploadResponse {
  assetId: string;
  versionId: string;
  multiPartUploadId: string;
  key: string;
}

export type UploadCreateResponse = SmallUploadResponse | LargeUploadResponse;

export interface GetPartUploadUrlParams {
  multiPartUploadId: string;
  key: string;
  partNumber: number;
}

export interface GetPartUploadUrlResponse {
  url: string;
}

export interface CompleteMultipartParams {
  multiPartUploadId: string;
  key: string;
  parts: {
    etag: string;
    partNumber: number;
  }[];
}

export interface UploadFileParams {
  filePath?: string;
  buffer?: Buffer | ArrayBuffer;
  file?: File;
  fileName?: string;
  ext?: string;
  mime?: string;
}

export interface UploadFileOptions {
  parentBoardId?: string;
  assetId?: string;
  customFields?: {
    id: string;
    value?: string | null;
    values?: { id: string }[] | null;
  }[] | null;
  tags?: { id: string }[] | null;
  onProgress?: (progress: { percentage: number; uploadedBytes: number; totalBytes: number }) => void;
}

export interface UploadFileResponse {
  assetId: string;
  versionId: string;
}
