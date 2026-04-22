import type { BaseRecord } from "../../lib/db";

export type ProjectStatus = "DRAFT" | "ACTIVE" | "BLOCKED" | "STABLE" | "ARCHIVED";

export interface Project extends BaseRecord {
  workspace_id: string;
  name: string;
  slug: string;
  status: ProjectStatus;
  current_sprint_id: string | null;
}
