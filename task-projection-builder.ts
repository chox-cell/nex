export interface TaskProjectionInput {
  taskId: string;
  taskStatus: string;
  proofCount: number;
  verificationStatuses: string[];
  gateDecision?: 'GO' | 'NO_GO' | null;
  progressScore: number;
}

export interface TaskProjection {
  scopeType: 'task';
  scopeId: string;
  currentState: {
    status: string;
    proofAttached: boolean;
    hasBlockingVerification: boolean;
    gateDecision: 'GO' | 'NO_GO' | null;
    progressScore: number;
  };
}

export class TaskProjectionBuilder {
  static build(input: TaskProjectionInput): TaskProjection {
    return {
      scopeType: 'task',
      scopeId: input.taskId,
      currentState: {
        status: input.taskStatus,
        proofAttached: input.proofCount > 0,
        hasBlockingVerification: input.verificationStatuses.includes('blocking'),
        gateDecision: input.gateDecision ?? null,
        progressScore: input.progressScore,
      },
    };
  }
}
