import type { BaseRecord } from "../../lib/db";

export type TaskEdgeType = "BLOCKS" | "REQUIRES" | "FOLLOWS" | "INFORMS";

export interface TaskEdge extends BaseRecord {
  task_id: string;
  depends_on_task_id: string;
  edge_type: TaskEdgeType;
}
