import type { CursorPageParams } from "@air/api-core";

export interface Tag {
  id: string;
  name: string;
}

export interface TagListParams extends CursorPageParams {
  name?: string;
}

export interface TagCreateParams {
  name: string;
}

export interface TagUpdateParams {
  name?: string;
}
