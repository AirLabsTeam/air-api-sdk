import type { AirApi } from "@air/api-rest";
import type { WorkspaceSession } from "../workspace.js";

const APP_BASE_URL = "https://app.air.inc";
function sanitizeStringForUrl(str) {
  return str
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .trim()
    .replace(/[ ]+/g, "-")
    .toLowerCase();
}
export function buildBoardUrl(boardId, boardTitle) {
  const slug = boardTitle ? `${sanitizeStringForUrl(boardTitle)}-` : "";
  return `${APP_BASE_URL}/b/${slug}${boardId}`;
}
export function buildAssetUrl(versionId, board) {
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
) {
  const boards = await client.assets.listBoards(assetId, { limit: 1 }, session.context());
  const board = boards.data[0];
  return buildAssetUrl(versionId, board ? { id: board.id, title: board.title } : void 0);
}
