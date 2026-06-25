import type { AirBase, PagePromise } from "@air/api-core";
import type {
  Library,
  LibraryCreateParams,
  LibraryListParams,
  LibraryUpdateParams,
} from "../types/libraries";

export class Libraries {
  constructor(private client: AirBase) {}

  list(params: LibraryListParams = {}): PagePromise<Library> {
    const query: Record<string, string | number | boolean | undefined> = {
      limit: params.limit,
      cursor: params.cursor,
      search: params.search,
    };

    return this.client.requestCursorPage<Library>(
      { method: "GET", path: "/libraries", query },
      query,
    );
  }

  async get(libraryId: string): Promise<Library> {
    return this.client.request<Library>({
      method: "GET",
      path: `/libraries/${libraryId}`,
    });
  }

  async create(params: LibraryCreateParams): Promise<Library> {
    return this.client.request<Library>({
      method: "POST",
      path: "/libraries",
      body: params,
    });
  }

  async update(libraryId: string, params: LibraryUpdateParams): Promise<void> {
    return this.client.request<void>({
      method: "PATCH",
      path: `/libraries/${libraryId}`,
      body: params,
    });
  }

  async delete(libraryId: string): Promise<void> {
    return this.client.request<void>({
      method: "DELETE",
      path: `/libraries/${libraryId}`,
    });
  }
}
