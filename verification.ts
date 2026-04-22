import type { BaseRecord } from "../../lib/db";

export type VerificationType =
  | "build_check"
  | "proof_check"
  | "test_check"
  | "critic_check"
  | "founder_review"
  | "gate_check";

export type VerificationStatus = "pass" | "warning" | "fail" | "blocking";

export interface Verification extends BaseRecord {
  task_id: string;
  run_id: string | null;
  check_type: VerificationType;
  status: VerificationStatus;
  score: number;
  notes: string;
  blocking: boolean;
}
