import type { ConnectorLifecycleState } from "@nex/core";

export interface ProviderConnectorContract<TTaskPacket, TResultPacket, TNormalizedInput> {
  readonly providerName: string;

  getLifecycleState(taskId: string): Promise<ConnectorLifecycleState>;
  buildTaskPacket(taskId: string): Promise<TTaskPacket>;
  normalizeResult(input: TNormalizedInput): Promise<TResultPacket>;
  listResultsByTask(taskId: string): Promise<TResultPacket[]>;
}
