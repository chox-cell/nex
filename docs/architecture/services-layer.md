# NEX Services Layer

## Sprint 01 Services

- `MissionService`
- `PlanService`
- `ExecutionService`
- `TaskGovernanceService`

## Sprint 02 Services

- `EventService`
- `ProjectionService`
- `ResumePacketService`
- `PatternService`
- `EvidenceService`
- `VerificationService`
- `GateDecisionService`
- `AuditService`
- `SnapshotService`
- `TruthSyncService`

## Sprint 03 Services

- `ToolProviderService`
- `ToolPacketService`
- `RepoReferenceService`
- `TerminalReferenceService`
- `ProviderConnectorContract`
- `CodexConnectorService`

## Runtime Flow

`seed -> repository -> service -> route`

## Guarantees

- plan updates create version records
- task creation requires owner
- task status transitions respect the NEX state machine
- task dependency edges reject self-invalid relationships
- plan-to-sprint conversion preserves project and plan linkage
- events persist for important execution and truth actions
- projections derive progress and blockers from persisted truth
- resume packets are generated from current projections
- task closure requires evidence, verification, gate, audit, and snapshot coverage
- connector contracts can prepare task packets and normalize worker-style results without granting proof or closure authority
