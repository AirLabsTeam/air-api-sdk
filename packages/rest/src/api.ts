import { AirBase, type AirBaseOptions } from "@air/api-core";
import { Assets } from "./resources/assets";
import { AuditLogs } from "./resources/audit-logs";
import { Boards } from "./resources/boards";
import { CustomFields } from "./resources/custom-fields";
import { Imports } from "./resources/imports";
import { Roles } from "./resources/roles";
import { Tags } from "./resources/tags";
import { Uploads } from "./resources/uploads";

export interface AirApiOptions extends AirBaseOptions {}

export class AirApi extends AirBase {
  readonly assets: Assets;
  readonly boards: Boards;
  readonly tags: Tags;
  readonly customFields: CustomFields;
  readonly roles: Roles;
  readonly imports: Imports;
  readonly auditLogs: AuditLogs;
  readonly uploads: Uploads;

  constructor(options: AirApiOptions = {}) {
    super(options);

    this.assets = new Assets(this);
    this.boards = new Boards(this);
    this.tags = new Tags(this);
    this.customFields = new CustomFields(this);
    this.roles = new Roles(this);
    this.imports = new Imports(this);
    this.auditLogs = new AuditLogs(this);
    this.uploads = new Uploads(this);
  }
}
