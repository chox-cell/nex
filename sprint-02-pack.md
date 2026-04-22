# NEX Sprint 02 Pack — Memory + Truth Spine

## Mission
Make NEX stateful, recoverable, and proof-aware.

## Sprint Goal
Transform NEX from a structured planning/execution shell into a system that:
- records events
- computes current state
- builds resume packets
- stores evidence
- runs verification
- applies gate decisions
- writes audits
- saves snapshots

## Deliverables
- Event Store
- State Projection Engine
- Resume Packet Engine
- Pattern Records
- Evidence model
- Verification model
- Gate Decision model
- Audit Record model
- Snapshot model
- Memory Timeline UI skeleton
- Proof Vault UI skeleton
- Gates & Blockers UI skeleton

## Phases

### Phase 1 — Event Memory Foundation
Tasks:
1. create `events` schema
2. create event types enum/constants
3. create event write service
4. write task lifecycle events
5. write sprint lifecycle events
6. create memory timeline route shell

Gate:
- events can be written and queried by scope
- core task/sprint actions create events

### Phase 2 — State Projections + Resume
Tasks:
1. create `state_projections` schema
2. create projection service
3. define task projection shape
4. define sprint projection shape
5. create `resume_packets` schema
6. create resume packet builder
7. create resume packet preview endpoint

Gate:
- current state can be read without replaying full event history manually
- resume packet contains next action and blockers

### Phase 3 — Proof Vault Foundation
Tasks:
1. create `evidence` schema
2. define evidence types
3. create evidence attachment service
4. connect evidence to task/run
5. create proof vault route shell

Gate:
- evidence can be attached and listed by task
- at least 5 evidence types supported

### Phase 4 — Verification + Gates
Tasks:
1. create `verifications` schema
2. create verification types/statuses
3. create `gate_decisions` schema
4. create verification service
5. create task gate service
6. enforce no-close-on-blocking rule
7. create gates route shell

Gate:
- task close blocked if any blocking verification exists
- gate decision can be persisted and queried

### Phase 5 — Audit + Snapshot
Tasks:
1. create `audit_records` schema
2. create `snapshots` schema
3. create audit write service
4. create snapshot write service
5. define task close flow with audit + snapshot hooks

Gate:
- task close path can emit audit + snapshot refs
- audit and snapshot retrievable by scope

## Hard Stops
- no events = no state truth
- no evidence model = no proof layer
- no gate enforcement = fake completion risk
- no snapshot path = no recoverability

## Success Criteria
1. NEX records meaningful lifecycle events
2. NEX can compute current state projections
3. NEX can generate resume packets
4. NEX can attach evidence to tasks/runs
5. NEX can run verification and block completion
6. NEX can persist gate decisions, audits, and snapshots
