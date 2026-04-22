export interface TaskProgressInput {
  buildComplete: boolean;
  proofAttached: boolean;
  verificationPassed: boolean;
  gateGo: boolean;
  auditWritten: boolean;
  snapshotSaved: boolean;
}

export class TaskProgressService {
  static calculate(input: TaskProgressInput): number {
    return (
      (input.buildComplete ? 20 : 0) +
      (input.proofAttached ? 20 : 0) +
      (input.verificationPassed ? 20 : 0) +
      (input.gateGo ? 15 : 0) +
      (input.auditWritten ? 10 : 0) +
      (input.snapshotSaved ? 15 : 0)
    );
  }
}
