import { APIError } from "@air/api-rest";
import { WorkspaceRequiredError } from "../workspace.js";

export function handleToolError(error: unknown) {
  if (error instanceof WorkspaceRequiredError) {
    return {
      isError: true,
      content: [{ type: "text", text: error.message }],
    };
  }
  if (error instanceof APIError) {
    return {
      isError: true,
      content: [{ type: "text", text: `API Error (${error.status}): ${error.message}` }],
    };
  }
  throw error;
}
