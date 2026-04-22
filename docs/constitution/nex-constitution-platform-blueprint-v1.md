# NEX Constitution + Platform Blueprint v1

## System Identity

- **System Name**: NEX
- **Product**: NEX Founder OS v1
- **Mission**: Be the single command system that plans work, tracks execution, preserves memory, validates proof, and protects founder momentum across tools.
- **Core Thesis**: NEX is an execution memory + proof + control system.

## Constitutional Laws

1. NEX owns truth.
2. No task without owner.
3. No completion without proof.
4. No proof without verification.
5. No memory in chat only.
6. No silent drift.
7. No forward movement through blockers.
8. No important state without recovery.
9. Plans must be versioned.
10. Execution must be observable.

## Top-Level Architecture

```text
NEX Founder OS
├── Mission Layer
├── Planning Layer
├── Execution Layer
├── Memory Layer
├── Truth Layer
├── Tool Layer
└── Control Layer
```

## Layer Responsibilities

### Mission Layer
- vision
- strategic priorities
- objectives
- decisions

### Planning Layer
- plans
- plan versions
- plan sections
- plan actions

### Execution Layer
- projects
- sprints
- phases
- tasks
- task edges
- runs
- run steps

### Memory Layer
- events
- state projections
- resume packets
- pattern records

### Truth Layer
- evidence
- verifications
- gate decisions
- audit records
- snapshots

### Tool Layer
- tool providers
- tool sessions
- manual packets
- repo and terminal references

### Control Layer
- command center
- blockers
- next move logic
- operational summaries

## Required State Machines

### Project
`DRAFT -> ACTIVE -> BLOCKED -> STABLE -> ARCHIVED`

### Sprint
`DRAFT -> PLANNED -> ACTIVE -> BLOCKED -> REVIEW -> CLOSED`

### Phase
`DRAFT -> READY -> IN_PROGRESS -> BLOCKED -> VERIFIED -> DONE`

### Task
`DRAFT -> READY -> IN_PROGRESS -> BUILT -> PROOF_ATTACHED -> VERIFIED -> AUDITED -> SNAPSHOT_SAVED -> DONE`

### Failure Route
`ANY_ACTIVE_STATE -> FAIL -> READY`

## Progress Model

- build_complete = 20
- proof_attached = 20
- verification_passed = 20
- gate_go = 15
- audit_written = 10
- snapshot_saved = 15

Task closure requires:

- total score = 100
- no blocking verification
- gate decision = GO

## Sprint Discipline

- Sprint 01 builds the strategic and execution spine.
- Sprint 02 adds memory and truth.
- Sprint 03 adds tool spine and control views.
- Future layers may not leapfrog this order.

