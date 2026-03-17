export interface ImportCreateParams {
  sourceUrl: string;
  fileName?: string;
  ext?: string;
  recordedAt?: string;
  parentBoardId?: string;
  assetId?: string;
  description?: string;
  title?: string;
  customFields?:
    | {
        id: string;
        value?: string | null;
        values?: { id: string }[] | null;
      }[]
    | null;
  tags?: { id: string }[] | null;
}

export interface ImportCreateResponse {
  id: string;
  assetId: string;
  versionId: string;
}

export type ImportStatus = "pending" | "inProgress" | "succeeded" | "failed";

export interface ImportStatusResponse {
  status: ImportStatus;
  error?: {
    type: string;
    message: string;
  };
}
