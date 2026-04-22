# NEX Bootstrap Repo Structure

```text
nex/
├── README.md
├── docs/
│   ├── sprint-01-detailed-backlog.md
│   ├── sprint-01-task-graph.md
│   ├── sprint-01-gate-rules.md
│   ├── sprint-01-execution-order.md
│   ├── ai-builder-pack.md
│   ├── sprint-02-pack.md
│   └── bootstrap-repo-structure.md
├── src/
│   ├── app/
│   │   └── nex/
│   │       ├── page.tsx
│   │       ├── command-center/
│   │       ├── plans/
│   │       ├── projects/
│   │       ├── sprints/
│   │       ├── tasks/
│   │       ├── memory/
│   │       ├── proof/
│   │       ├── gates/
│   │       └── tools/
│   ├── core/
│   │   ├── constants/
│   │   ├── contracts/
│   │   ├── types/
│   │   ├── validators/
│   │   └── state-machine/
│   ├── db/
│   │   └── schemas/
│   │       ├── workspace.ts
│   │       ├── plan.ts
│   │       ├── project.ts
│   │       ├── sprint.ts
│   │       ├── phase.ts
│   │       ├── task.ts
│   │       ├── task-edge.ts
│   │       ├── run.ts
│   │       ├── run-step.ts
│   │       ├── event.ts
│   │       ├── state-projection.ts
│   │       ├── resume-packet.ts
│   │       ├── pattern-record.ts
│   │       ├── evidence.ts
│   │       ├── verification.ts
│   │       ├── gate-decision.ts
│   │       ├── audit-record.ts
│   │       ├── snapshot.ts
│   │       └── tool-provider.ts
│   ├── lib/
│   │   └── db.ts
│   └── modules/
│       ├── workspace/
│       ├── plans/
│       ├── projects/
│       ├── sprints/
│       ├── tasks/
│       ├── memory/
│       ├── truth/
│       ├── tools/
│       └── control/
```

## Architectural Rule
- schemas first
- services second
- routes third
- UI polish last
