# NEX Sprint 01 Gate Rules

## Universal Task Gate

A Sprint 01 task may move to `DONE` only if:

- the canonical domain object exists in persistent state
- route or service behavior exists if the task implies UI or service work
- proof is attached
- acceptance criteria are satisfied
- no blocking validation remains

## Phase Gates

### Phase S1-P1
PASS only if:

- founder workspace persists
- mission entities persist
- `/nex` renders workspace and mission summary

### Phase S1-P2
PASS only if:

- plans persist
- plan versions persist
- updates write append-only version history
- plan center renders real plan data

### Phase S1-P3
PASS only if:

- projects persist
- sprint / phase / task hierarchy persists
- task dependency graph persists
- project, sprint, and task routes resolve

### Phase S1-P4
PASS only if:

- plan-to-sprint conversion preserves plan and project linkage
- no task exists without owner
- invalid task transitions are rejected
- audit closure is written

## Hard Stops

- no persistent founder workspace
- no plan version trail
- orphan sprint, phase, or task records
- self-invalid task edges
- broken core routes
- cosmetic state badges without enforced rules

