# NEX Sprint 01 — Detailed Backlog

## Sprint Identity
- **Sprint**: 01
- **Name**: Strategic + Execution Spine
- **Mission**: Establish the canonical structure of work inside NEX Founder OS v1.
- **North Star**: Make `plan -> sprint -> phase -> task -> dependency graph` real inside the system.

## Sprint Outcome
At the end of Sprint 01, NEX must support:
1. A founder workspace
2. Vision + strategic priorities
3. Versioned plans
4. Projects linked to plans
5. Sprints, phases, tasks, and task dependencies
6. Core routes to view and operate this structure

---

## Phase S1-P1 — Workspace & Mission Foundation

### Task S1-P1-T1 — Create Workspace Domain Model
- **Goal**: Create canonical workspace entity for founder-first operation.
- **Scope**: `workspaces` table, domain type, repository contract
- **Dependencies**: none
- **Acceptance Criteria**:
  - `workspaces` schema exists
  - workspace type/status are modeled
  - repository methods exist for create/get/list current workspace
- **Required Proof**:
  - migration or schema file
  - repository interface file
  - sample seeded workspace row
- **Verification Rule**: schema and repository compile cleanly
- **Gate Condition**: no move to workspace UI without persistent workspace model
- **Status**: READY

### Task S1-P1-T2 — Seed Founder Workspace
- **Goal**: Create default founder workspace seed.
- **Scope**: bootstrap seed script or seed action
- **Dependencies**: S1-P1-T1
- **Acceptance Criteria**:
  - one founder workspace exists after seed
  - slug/name stable and queryable
- **Required Proof**:
  - seed script output
  - data query result
- **Verification Rule**: idempotent seed behavior
- **Gate Condition**: seed may be re-run safely
- **Status**: READY

### Task S1-P1-T3 — Create Vision and Strategic Priority Models
- **Goal**: Represent mission layer inside SSOT.
- **Scope**: `visions`, `strategic_priorities` schema + types + repositories
- **Dependencies**: S1-P1-T1
- **Acceptance Criteria**:
  - both entities persist
  - priorities include ranking/state
  - workspace association enforced
- **Required Proof**:
  - schema + type files
  - insert/read example
- **Verification Rule**: foreign key / linkage integrity
- **Gate Condition**: cannot continue to mission UI without persisted objects
- **Status**: READY

### Task S1-P1-T4 — Build `/nex` App Shell
- **Goal**: Create the main NEX shell route.
- **Scope**: root route layout, navigation stub, workspace context loading
- **Dependencies**: S1-P1-T2, S1-P1-T3
- **Acceptance Criteria**:
  - `/nex` route renders
  - founder workspace visible
  - mission layer summary visible
- **Required Proof**:
  - route screenshot
  - render output
- **Verification Rule**: route loads without broken state
- **Gate Condition**: app shell stable before plan center work
- **Status**: READY

---

## Phase S1-P2 — Planning Foundation

### Task S1-P2-T1 — Create Plans Schema
- **Goal**: Persist plans as first-class objects.
- **Scope**: `plans` table + domain types + repository
- **Dependencies**: S1-P1-T1
- **Acceptance Criteria**:
  - plan belongs to workspace/project
  - plan contains name/goal/status
- **Required Proof**:
  - schema file
  - type definition
- **Verification Rule**: plan CRUD service compiles
- **Gate Condition**: plans must exist before versions
- **Status**: READY

### Task S1-P2-T2 — Create Plan Versions Schema
- **Goal**: Make plans versioned by law.
- **Scope**: `plan_versions` table + append-only write flow
- **Dependencies**: S1-P2-T1
- **Acceptance Criteria**:
  - plan edit creates version record
  - version payload stores full plan snapshot
- **Required Proof**:
  - schema + version write example
- **Verification Rule**: no in-place history loss
- **Gate Condition**: no mutable plan without version trail
- **Status**: READY

### Task S1-P2-T3 — Build Plan Service Layer
- **Goal**: Implement create/update/version/list plan use cases.
- **Scope**: service functions + validation
- **Dependencies**: S1-P2-T1, S1-P2-T2
- **Acceptance Criteria**:
  - create plan
  - update plan
  - auto-version on change
  - fetch current + versions
- **Required Proof**:
  - service tests or invocation outputs
- **Verification Rule**: updates always produce version record
- **Gate Condition**: plan service stable before UI
- **Status**: READY

### Task S1-P2-T4 — Build Plan Center UI
- **Goal**: Create plan management screen.
- **Scope**: `/nex/plans`, `/nex/plans/:planId`
- **Dependencies**: S1-P2-T3, S1-P1-T4
- **Acceptance Criteria**:
  - list plans
  - view plan details
  - view version history
  - create/update plan flow visible
- **Required Proof**:
  - UI screenshots or route render evidence
- **Verification Rule**: no dead route, version timeline visible
- **Gate Condition**: plan center usable before sprint conversion
- **Status**: READY

---

## Phase S1-P3 — Execution Foundation

### Task S1-P3-T1 — Create Projects Schema
- **Goal**: Persist projects under workspace.
- **Scope**: `projects` table + repository
- **Dependencies**: S1-P1-T1
- **Acceptance Criteria**:
  - project belongs to workspace
  - has status/current sprint link
- **Required Proof**:
  - schema + repository file
- **Verification Rule**: project linkage integrity
- **Gate Condition**: no sprint without project
- **Status**: READY

### Task S1-P3-T2 — Create Sprint / Phase / Task Schemas
- **Goal**: Create execution hierarchy.
- **Scope**: `sprints`, `phases`, `tasks`
- **Dependencies**: S1-P3-T1, S1-P2-T1
- **Acceptance Criteria**:
  - hierarchy persists correctly
  - task owner and constraints modeled
  - task status modeled
- **Required Proof**:
  - schema files
  - sample hierarchy insert
- **Verification Rule**: parent-child relations valid
- **Gate Condition**: no task graph without task entities
- **Status**: READY

### Task S1-P3-T3 — Create Task Edge Schema
- **Goal**: Model dependencies explicitly.
- **Scope**: `task_edges` table + graph service contract
- **Dependencies**: S1-P3-T2
- **Acceptance Criteria**:
  - task-to-task dependency persists
  - edge types supported (`blocks`, `requires`, `follows`, `informs`)
- **Required Proof**:
  - schema + example dependency insertion
- **Verification Rule**: graph data rejects self-invalid edges
- **Gate Condition**: no sprint graph without edge model
- **Status**: READY

### Task S1-P3-T4 — Build Execution Service Layer
- **Goal**: Implement project/sprint/phase/task creation flows.
- **Scope**: create/list/detail services
- **Dependencies**: S1-P3-T1, S1-P3-T2, S1-P3-T3
- **Acceptance Criteria**:
  - create project
  - create sprint under project/plan
  - create phases under sprint
  - create tasks under phase
  - create edges between tasks
- **Required Proof**:
  - invocation outputs or tests
- **Verification Rule**: hierarchy and graph read correctly
- **Gate Condition**: execution service stable before views
- **Status**: READY

### Task S1-P3-T5 — Build Project / Sprint / Task Views
- **Goal**: Expose execution spine in UI.
- **Scope**: `/nex/projects`, `/nex/projects/:projectId`, `/nex/sprints/:sprintId`, `/nex/tasks/:taskId`
- **Dependencies**: S1-P3-T4
- **Acceptance Criteria**:
  - project board visible
  - sprint detail visible with phases/tasks
  - task detail visible with owner/status/constraints
- **Required Proof**:
  - screenshots / route outputs
- **Verification Rule**: routes resolve with real data
- **Gate Condition**: views must reflect canonical entities
- **Status**: READY

---

## Phase S1-P4 — Basic Flow Closure

### Task S1-P4-T1 — Plan-to-Sprint Conversion Flow
- **Goal**: Convert strategy into execution.
- **Scope**: manual conversion flow from plan to sprint
- **Dependencies**: S1-P2-T4, S1-P3-T4
- **Acceptance Criteria**:
  - a plan can spawn a sprint
  - created sprint references plan and project
- **Required Proof**:
  - conversion result record
  - UI or service evidence
- **Verification Rule**: no orphan sprint generation
- **Gate Condition**: flow must preserve upstream linkage
- **Status**: READY

### Task S1-P4-T2 — Task Ownership + Status Transition Rules
- **Goal**: Add core execution discipline.
- **Scope**: owner fields, status transitions, validators
- **Dependencies**: S1-P3-T2
- **Acceptance Criteria**:
  - no task without owner
  - only valid state transitions allowed
- **Required Proof**:
  - validation outputs / tests
- **Verification Rule**: invalid transitions rejected
- **Gate Condition**: no task flow without state discipline
- **Status**: READY

### Task S1-P4-T3 — Sprint 01 Audit Closure
- **Goal**: Validate that Sprint 01 outcome exists end-to-end.
- **Scope**: static review + manual walkthrough + findings note
- **Dependencies**: all prior Sprint 01 tasks
- **Acceptance Criteria**:
  - plan -> sprint -> phase -> task -> edge flow demonstrated
  - no broken core routes
  - sprint outcome documented
- **Required Proof**:
  - audit note
  - screenshots / data outputs
- **Verification Rule**: no missing canonical object
- **Gate Condition**: Sprint 01 cannot close without audit
- **Status**: READY

---

## Sprint 01 Definition of Done
Sprint 01 is DONE only if all are true:
1. Founder workspace exists and renders
2. Vision and strategic priorities persist
3. Plans are versioned
4. Projects persist and link correctly
5. Sprints, phases, tasks, and task edges persist
6. Core routes render canonical data
7. A plan can be converted into a sprint
8. Task owner and status discipline are enforced
9. Sprint 01 audit is written
