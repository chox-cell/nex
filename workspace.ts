import type { BaseRecord } from "../../lib/db";

export type WorkspaceStatus = "ACTIVE" | "BLOCKED" | "ARCHIVED";
export type WorkspaceType = "FOUNDER" | "INTERNAL";

export interface Workspace extends BaseRecord {
  name: string;
  slug: string;
  type: WorkspaceType;
  status: WorkspaceStatus;
}
