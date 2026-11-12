import type { CursorPageResponse } from "@air/api-core";
import type {
  BoardShareLink,
  ShareLinkCommentsAccess,
  ShareLinkCustomFieldsAccess,
} from "./share-links";

/**
 * A field on a content collection form.
 *
 * `customField` requires `customFieldId`. The other types reject it.
 * `custom_field` is not accepted.
 */
export type FormField =
  | {
      type: "title" | "description" | "tags";
      required: boolean;
    }
  | {
      type: "customField";
      required: boolean;
      customFieldId: string;
    };

/**
 * Content collection form on a board. A board has at most one.
 *
 * `description` is the form's intro text, not the description visitors
 * fill in. The response omits it when it is null.
 */
export interface Form {
  id: string;
  title: string;
  description?: string;
  createSubmissionBoard: boolean;
  autoSubmit: boolean;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Response for `GET /boards/:boardId/forms`.
 * `data` holds the board's form, or is empty when the board has none.
 * There is no query. `pagination.hasMore` is false and `cursor` is null.
 */
export interface FormListResponse extends CursorPageResponse<Form> {
  total: number;
}

/**
 * Fields shared by form create and update.
 *
 * Sending `fields` replaces the set. On create, omitting `fields` applies
 * the workspace default, and `fields: []` stores none. On update, omitting
 * `fields` leaves the current set. Two fields with the same `type` and
 * `customFieldId` are rejected.
 *
 * `description: null` stores no intro text. An empty `title` or
 * `description` is rejected.
 */
export interface FormSettingsParams {
  description?: string | null;
  createSubmissionBoard?: boolean;
  autoSubmit?: boolean;
  fields?: FormField[];
}

/** Body for `POST /boards/:boardId/forms`. */
export interface FormCreateParams extends FormSettingsParams {
  title: string;
}

/** Body for `PATCH /boards/:boardId/forms/:formId`. */
export interface FormUpdateParams extends FormSettingsParams {
  title?: string;
}

/**
 * A form's share link. The same type as a board share link, including
 * `expiresAt: string | null` when the link does not expire. Asset version
 * fields (`followsDefaultVersion`, `versionId`, `showAllVersions`) are not
 * on this type. `url` uses `/d/<id>`.
 */
export type FormShareLink = BoardShareLink;

/**
 * Response for `GET /boards/:boardId/forms/:formId/share-links`.
 * `data` holds the form's share link, or is empty when the form has none.
 * A disabled link is included (`active: false`).
 */
export interface FormShareLinkListResponse extends CursorPageResponse<FormShareLink> {
  total: number;
}

/**
 * Settings for a form share link.
 *
 * `password` is write only. `null` clears `password` and `expiresAt`.
 * An empty password is rejected. `expiresAt` is an ISO 8601 date-time in
 * the future, and `null` on update clears it. Omitted `requireAccount`
 * follows the workspace default for form links.
 *
 * `allowDownload`, `comments`, and `customFields` are on the response and
 * come from the Content Collection role. Create and update accept them and
 * do not store them, so sending a different value does not change the role.
 *
 * Form links are not plan-gated. A password, an expiration, or
 * `requireAccount` is stored on every plan.
 */
export interface FormShareLinkWriteSettings {
  active?: boolean;
  allowDownload?: boolean;
  /** Write only. `null` removes the password. */
  password?: string | null;
  /** ISO 8601 date-time in the future. `null` removes the expiration. */
  expiresAt?: string | null;
  requireAccount?: boolean;
  comments?: ShareLinkCommentsAccess;
  customFields?: ShareLinkCustomFieldsAccess;
}

/** Body for `POST /boards/:boardId/forms/:formId/share-links`. */
export type FormShareLinkCreateParams = FormShareLinkWriteSettings;

/** Body for `PATCH /boards/:boardId/forms/:formId/share-links/:shareLinkId`. */
export type FormShareLinkUpdateParams = FormShareLinkWriteSettings;
