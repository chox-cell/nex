# NEX AI Builder Pack — Sprint 01

## Purpose
This pack gives an AI builder enough structure to build Sprint 01 without drifting from the NEX Constitution.

## Product Identity
- **Product**: NEX
- **Edition**: Founder OS v1
- **Scope**: Internal-only, founder-first
- **Core Mission**: Turn plan -> sprint -> phase -> task into a canonical, versioned, visible work structure.

## Non-Negotiable Laws
1. NEX owns truth
2. No task without owner
3. No completion without proof
4. No memory in chat only
5. Plans must be versioned
6. Execution must be observable

## Build Objective for Sprint 01
Build the strategic and execution spine only.
Do **not** build memory automation, proof vault automation, or public multi-user features in this sprint.

## Required Deliverables
- Founder workspace persistence
- Vision and strategic priorities persistence
- Plans and plan versions persistence
- Projects, sprints, phases, tasks persistence
- Task edge dependency graph persistence
- Basic routes for `/nex`, plans, projects, sprints, tasks
- Plan-to-sprint conversion flow
- Task owner and status transition discipline

## Forbidden Drift
Do not add:
- billing
- external auth complexity
- marketplace
- public collaboration
- dozens of integrations
- over-engineered automation
- memory/proof features beyond Sprint 01 requirements

## Suggested Repo Structure
```text
apps/
  founder-os/
    src/
      app/
      modules/
        mission/
        planning/
        execution/
packages/
  core/
    types/
    laws/
    state-machine/
  ssot/
    repositories/
    services/
  memory/
    (placeholder only in Sprint 01)
docs/
```

## Domain Modules to Create
### Mission Module
- workspace types + repository
- vision types + repository
- strategic priority types + repository

### Planning Module
- plans types + repository
- plan versions types + repository
- plan services

### Execution Module
- projects types + repository
- sprints/phases/tasks types + repository
- task edge graph service
- task owner/state validator

## Route Set
- `/nex`
- `/nex/plans`
- `/nex/plans/:planId`
- `/nex/projects`
- `/nex/projects/:projectId`
- `/nex/sprints/:sprintId`
- `/nex/tasks/:taskId`

## State Models to Enforce
### Project
`DRAFT -> ACTIVE -> BLOCKED -> STABLE -> ARCHIVED`

### Sprint
`DRAFT -> PLANNED -> ACTIVE -> BLOCKED -> REVIEW -> CLOSED`

### Phase
`DRAFT -> READY -> IN_PROGRESS -> BLOCKED -> VERIFIED -> DONE`

### Task
`DRAFT -> READY -> IN_PROGRESS -> BUILT -> PROOF_ATTACHED -> VERIFIED -> AUDITED -> SNAPSHOT_SAVED -> DONE`

## Minimal Acceptance Checklist
- [ ] founder workspace exists and loads
- [ ] plans can be created and versioned
- [ ] projects can be created under workspace
- [ ] sprints/phases/tasks can be created
- [ ] dependencies can be created between tasks
- [ ] core routes render real data
- [ ] plan-to-sprint conversion works
- [ ] owner required on task
- [ ] invalid task transitions rejected
- [ ] Sprint 01 audit note prepared

## Builder Output Format
Every completed task must return:

```text
TASK NAME:
FILES CHANGED:
WHAT WAS BUILT:
WHAT WAS NOT TOUCHED:
TESTS RUN:
PROOF:
EDGE CASES CHECKED:
RESULT:
STATUS: DONE / FAIL / PARTIAL
```

## QA Checklist
- Can the workspace seed be rerun safely?
- Does plan update always produce version history?
- Can a sprint exist without a plan link? (should be blocked or explicitly controlled)
- Can a task exist without owner? (must be blocked)
- Are broken routes present? (must be no)
- Are self-invalid dependency edges blocked?

## Critic Checklist
- look for orphan objects
- look for silent overwrite of plans
- look for task graph corruption
- look for invalid status transitions
- look for UI shells not backed by canonical data

## LawKeeper Checklist
- no task without owner
- no plan without version trail
- no broken navigation across core routes
- no execution object without parent linkage
- no fake progress indicators disconnected from state

## Final Sprint 01 Question
Can NEX now represent real work structure faithfully enough to support Memory + Truth in Sprint 02?
