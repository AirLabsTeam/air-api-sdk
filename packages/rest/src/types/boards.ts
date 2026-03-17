import type { AssetCustomFieldValue } from "./assets";
import type { CursorPageParams } from "@air/api-core";

export interface Board {
  id: string;
  parentBoardId: string | null;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  customFields: AssetCustomFieldValue[] | undefined;
}

export interface BoardListParams extends CursorPageParams {
  name?: string;
  parentBoardId?: string;
  customField?: string | string[];
}

export interface BoardCreateParams {
  title: string;
  description?: string;
  parentBoardId?: string;
}

export interface BoardUpdateParams {
  title?: string;
  description?: string;
  parentBoardId?: string | null;
}

export interface AddBoardAssetsParams {
  assetIds: string[];
}

export interface SetBoardCustomFieldParams {
  value?: string | null;
  values?: { id: string }[] | null;
}

export interface Guest {
  id: string;
  email: string;
  roleId: string;
  boardId: string;
}

export interface AddGuestParams {
  email: string;
  roleId: string;
}

export interface UpdateGuestParams {
  roleId: string;
}

export interface GuestListParams {
  email?: string;
}

export interface GuestListResponse {
  data: Guest[];
}
