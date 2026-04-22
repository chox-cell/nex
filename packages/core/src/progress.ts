export const TASK_PROGRESS_WEIGHTS = {
  buildComplete: 20,
  proofAttached: 20,
  verificationPassed: 20,
  gateGo: 15,
  auditWritten: 10,
  snapshotSaved: 15,
} as const;

export interface TaskProgressInput {
  buildComplete: boolean;
  proofAttached: boolean;
  verificationPassed: boolean;
  gateGo: boolean;
  auditWritten: boolean;
  snapshotSaved: boolean;
}

export function calculateTaskProgressScore(input: TaskProgressInput): number {
  return (
    (input.buildComplete ? TASK_PROGRESS_WEIGHTS.buildComplete : 0) +
    (input.proofAttached ? TASK_PROGRESS_WEIGHTS.proofAttached : 0) +
    (input.verificationPassed ? TASK_PROGRESS_WEIGHTS.verificationPassed : 0) +
    (input.gateGo ? TASK_PROGRESS_WEIGHTS.gateGo : 0) +
    (input.auditWritten ? TASK_PROGRESS_WEIGHTS.auditWritten : 0) +
    (input.snapshotSaved ? TASK_PROGRESS_WEIGHTS.snapshotSaved : 0)
  );
}

