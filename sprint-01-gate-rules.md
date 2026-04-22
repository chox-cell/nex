# NEX Sprint 01 — Gate Rules

## Sprint Gate Philosophy
Sprint 01 builds the canonical work structure. Any gap in canonical structure blocks closure.

---

## Task Gate Rules

### Universal Task Gate
A Sprint 01 task may move to DONE only if:
- scope object exists in persistent model
- required route/service exists if task includes UI/service work
- required proof is attached
- acceptance criteria are satisfied
- no blocking validation remains open

### Task-Specific Gate Examples

#### S1-P1-T1 Gate
- `workspaces` persistence exists
- repository contract implemented
- schema load or migration proof attached

#### S1-P2-T2 Gate
- plan version writes on change
- version snapshot payload stored
- no silent overwrite path remains

#### S1-P3-T3 Gate
- dependency edges persist
- self-invalid edge blocked
- edge type enum enforced

#### S1-P4-T2 Gate
- invalid transitions rejected
- owner required on task create/update
- state machine behavior documented

---

## Phase Gates

### Phase S1-P1 Gate — Workspace & Mission Foundation
PASS only if:
- founder workspace exists
- mission entities persist
- `/nex` shell renders workspace and mission summary

### Phase S1-P2 Gate — Planning Foundation
PASS only if:
- plans persist
- plan versions persist
- plan updates produce version entries
- plan center UI works with real data

### Phase S1-P3 Gate — Execution Foundation
PASS only if:
- projects persist
- sprint/phase/task hierarchy persists
- task edge graph persists
- project/sprint/task views resolve correctly

### Phase S1-P4 Gate — Basic Flow Closure
PASS only if:
- a plan converts into a sprint
- tasks enforce owner/state rules
- Sprint 01 audit note is written

---

## Sprint 01 Hard Stops
Stop Sprint 01 immediately if any of these occur:
- no persistent founder workspace
- plan editing without version trail
- sprint/task entities created without parent linkage
- dependency graph absent or corrupt
- core route broken (`/nex`, `/nex/plans`, `/nex/projects`, `/nex/sprints/:id`, `/nex/tasks/:id`)
- task ownership not enforced
- status transition rules not enforced

---

## Proof Requirements by Work Type

### Schema Task
Must provide:
- schema definition / migration
- sample insert/read evidence

### Service Task
Must provide:
- invocation output or tests
- validation evidence

### UI Task
Must provide:
- route render proof
- canonical data visible in screen

### Flow Task
Must provide:
- end-to-end walkthrough evidence
- object linkage proof across entities

---

## Sprint 01 Closure Gate
Sprint 01 closes only if:
1. founder workspace exists
2. mission layer persists
3. plans are versioned
4. execution hierarchy persists
5. dependency graph persists
6. core routes render
7. plan-to-sprint flow works
8. task owner/state discipline works
9. audit record exists
