import { APIError } from "@air/api-rest";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { WorkspaceRequiredError } from "../workspace.js";
import { textContent } from "../types.js";

export function handleToolError(error: unknown): CallToolResult {
  if (error instanceof WorkspaceRequiredError) {
    return {
      isError: true,
      content: [textContent(error.message)],
    };
  }
  if (error instanceof APIError) {
    return {
      isError: true,
      content: [textContent(`API Error (${error.status}): ${error.message}`)],
    };
  }
  throw error;
}
