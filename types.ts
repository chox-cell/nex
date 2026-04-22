export type NexEventType =
  | 'plan_created'
  | 'plan_versioned'
  | 'project_created'
  | 'sprint_created'
  | 'phase_created'
  | 'task_created'
  | 'task_status_changed'
  | 'run_created'
  | 'evidence_attached'
  | 'verification_written'
  | 'gate_decided'
  | 'snapshot_saved';

export interface NexEvent {
  id: string;
  workspaceId: string;
  scopeType: 'workspace' | 'project' | 'sprint' | 'phase' | 'task' | 'run';
  scopeId: string;
  eventType: NexEventType;
  actorType: 'system' | 'tool' | 'founder';
  actorRef: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
