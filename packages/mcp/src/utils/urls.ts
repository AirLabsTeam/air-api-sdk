import type { AirApi } from "@air/api-rest";
import type { WorkspaceSession } from "../workspace.js";

const APP_BASE_URL = "https://app.air.inc";

function sanitizeStringForUrl(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .trim()
    .replace(/[ ]+/g, "-")
    .toLowerCase();
}

export function buildBoardUrl(boardId: string, boardTitle?: string | null): string {
  const slug = boardTitle ? `${sanitizeStringForUrl(boardTitle)}-` : "";
  return `${APP_BASE_URL}/b/${slug}${boardId}`;
}

export function buildAssetUrl(
  versionId: string,
  board?: { id: string; title?: string | null },
): string {
  const clipSegment = `/c/${versionId}`;
  if (board) {
    const slug = board.title ? `${sanitizeStringForUrl(board.title)}-` : "";
    return `${APP_BASE_URL}/b/${slug}${board.id}${clipSegment}`;
  }
  return `${APP_BASE_URL}${clipSegment}`;
}

export async function getAssetUrl(
  client: AirApi,
  session: WorkspaceSession,
  assetId: string,
  versionId: string,
): Promise<string> {
  const boards = await client.assets.listBoards(assetId, { limit: 1 }, session.context());
  const board = boards.data[0];
  return buildAssetUrl(versionId, board ? { id: board.id, title: board.title } : undefined);
}
