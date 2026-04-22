export interface VerificationRecord {
  checkType: string;
  status: 'pass' | 'warning' | 'fail' | 'blocking';
  score?: number;
  notes?: string;
}

export class VerificationService {
  static summarize(records: VerificationRecord[]) {
    const blocking = records.some((r) => r.status === 'blocking');
    const failed = records.some((r) => r.status === 'fail');
    const warnings = records.filter((r) => r.status === 'warning').length;
    const passed = records.filter((r) => r.status === 'pass').length;

    return {
      blocking,
      failed,
      warnings,
      passed,
      total: records.length,
    };
  }
}
