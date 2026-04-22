export interface ResumePacketInput {
  currentObjective: string;
  currentState: string;
  currentTask: string;
  completedSteps: string[];
  failedSteps: string[];
  blockers: string[];
  pendingDependencies: string[];
  lastProof: string[];
  nextRequiredAction: string;
  relevantConstraints: string[];
}

export class ResumePacketBuilder {
  static build(input: ResumePacketInput) {
    return {
      current_objective: input.currentObjective,
      current_state: input.currentState,
      current_task: input.currentTask,
      completed_steps: input.completedSteps,
      failed_steps: input.failedSteps,
      blockers: input.blockers,
      pending_dependencies: input.pendingDependencies,
      last_proof: input.lastProof,
      next_required_action: input.nextRequiredAction,
      relevant_constraints: input.relevantConstraints,
    };
  }
}
