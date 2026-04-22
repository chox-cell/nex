# NEX Schema Spine

## Mission Objects

- `workspace`
- `vision`
- `strategic_priority`
- `objective`
- `decision`

## Planning Objects

- `plan`
- `plan_version`
- `plan_section`
- `plan_action`

## Execution Objects

- `project`
- `sprint`
- `phase`
- `task`
- `task_edge`
- `run`
- `run_step`

## Memory Objects

- `event`
- `state_projection`
- `resume_packet`
- `pattern_record`

## Tool Objects

- `tool_provider`
- `tool_packet`

## Connector Contract Objects

- `codex_task_packet` (derived preview contract, not persisted as truth)
- `codex_result_packet`

## Truth Surface Objects

- `repo_reference`
- `terminal_run_reference`

## Truth Objects

- `evidence`
- `verification`
- `gate_decision`
- `audit_record`
- `snapshot`

## Persistence Strategy for v1

Sprint 01 uses a file-backed SSOT store:

- canonical record shape lives in `packages/core`
- append and update logic lives in `packages/ssot`
- the founder app reads only through runtime services
- important state is stored in `apps/founder-os/data/founder-os.v1.json`

This keeps truth persistent, inspectable, and easy to migrate to a database once the model stabilizes.

Sprint 02 extends the same file-backed SSOT with memory and truth arrays so existing founder state evolves in place instead of splitting across transient storage.

Sprint 03 continues the same pattern by adding a tool provider registry, task-scoped tool packets, repo and terminal truth surfaces, and connector result packets to the canonical store before any live connector automation is allowed.
