import { VerificationRecord, VerificationService } from '../verifications/verification-service';

export interface TaskGateInput {
  requiredProofAttached: boolean;
  acceptanceCriteriaSatisfied: boolean;
  snapshotSaved: boolean;
  verifications: VerificationRecord[];
}

export class TaskGateService {
  static decide(input: TaskGateInput): { decision: 'GO' | 'NO_GO'; reason: string } {
    const summary = VerificationService.summarize(input.verifications);

    if (!input.requiredProofAttached) {
      return { decision: 'NO_GO', reason: 'Required proof missing' };
    }
    if (!input.acceptanceCriteriaSatisfied) {
      return { decision: 'NO_GO', reason: 'Acceptance criteria not satisfied' };
    }
    if (!input.snapshotSaved) {
      return { decision: 'NO_GO', reason: 'Snapshot not saved' };
    }
    if (summary.blocking) {
      return { decision: 'NO_GO', reason: 'Blocking verification present' };
    }
    if (summary.failed) {
      return { decision: 'NO_GO', reason: 'Failed verification present' };
    }

    return { decision: 'GO', reason: 'Task satisfies gate conditions' };
  }
}
