import type { CursorPageParams } from "@air/api-core";

export interface Library {
  id: string;
  title: string;
  accessibility: "public" | "private";
  visibility: "workspaceMembers" | "libraryMembers";
  createdAt: string;
  updatedAt: string;
  // Omitted from the response when unset (strip-unset). `colorId`/`icon` are
  // intentionally not part of the V1 contract and land additively in V2.
  description?: string;
}

export interface LibraryListParams extends CursorPageParams {
  search?: string;
}

export interface LibraryCreateParams {
  title: string;
  description?: string;
  accessibility?: "public" | "private";
  visibility?: "workspaceMembers" | "libraryMembers";
}

export interface LibraryUpdateParams {
  title?: string;
  description?: string;
  accessibility?: "public" | "private";
  visibility?: "workspaceMembers" | "libraryMembers";
}
