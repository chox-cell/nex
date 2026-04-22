# NEX Sprint 01 — Task Graph

## Graph Overview

```text
S1-P1-T1 Create Workspace Domain Model
├── S1-P1-T2 Seed Founder Workspace
├── S1-P1-T3 Create Vision and Strategic Priority Models
│   └── S1-P1-T4 Build /nex App Shell
│
S1-P2-T1 Create Plans Schema
└── S1-P2-T2 Create Plan Versions Schema
    └── S1-P2-T3 Build Plan Service Layer
        └── S1-P2-T4 Build Plan Center UI

S1-P3-T1 Create Projects Schema
└── S1-P3-T2 Create Sprint / Phase / Task Schemas
    └── S1-P3-T3 Create Task Edge Schema
        └── S1-P3-T4 Build Execution Service Layer
            └── S1-P3-T5 Build Project / Sprint / Task Views

S1-P2-T4 Build Plan Center UI
└── S1-P4-T1 Plan-to-Sprint Conversion Flow

S1-P3-T2 Create Sprint / Phase / Task Schemas
└── S1-P4-T2 Task Ownership + Status Transition Rules

All Prior Tasks
└── S1-P4-T3 Sprint 01 Audit Closure
```

## Dependency Table

| Task | Depends On |
|---|---|
| S1-P1-T1 | none |
| S1-P1-T2 | S1-P1-T1 |
| S1-P1-T3 | S1-P1-T1 |
| S1-P1-T4 | S1-P1-T2, S1-P1-T3 |
| S1-P2-T1 | S1-P1-T1 |
| S1-P2-T2 | S1-P2-T1 |
| S1-P2-T3 | S1-P2-T1, S1-P2-T2 |
| S1-P2-T4 | S1-P2-T3, S1-P1-T4 |
| S1-P3-T1 | S1-P1-T1 |
| S1-P3-T2 | S1-P3-T1, S1-P2-T1 |
| S1-P3-T3 | S1-P3-T2 |
| S1-P3-T4 | S1-P3-T1, S1-P3-T2, S1-P3-T3 |
| S1-P3-T5 | S1-P3-T4 |
| S1-P4-T1 | S1-P2-T4, S1-P3-T4 |
| S1-P4-T2 | S1-P3-T2 |
| S1-P4-T3 | all prior Sprint 01 tasks |

## Critical Path
1. S1-P1-T1
2. S1-P2-T1
3. S1-P2-T2
4. S1-P2-T3
5. S1-P2-T4
6. S1-P3-T1
7. S1-P3-T2
8. S1-P3-T3
9. S1-P3-T4
10. S1-P4-T1
11. S1-P4-T2
12. S1-P4-T3

## Parallelizable Work
- S1-P1-T2 and S1-P1-T3 after S1-P1-T1
- S1-P2-T1 and S1-P3-T1 after S1-P1-T1
- S1-P1-T4 can proceed while planning schemas stabilize
- S1-P3-T5 can begin basic shelling while execution services finalize

## Builder Priority Order
- **Wave 1**: S1-P1-T1, S1-P2-T1, S1-P3-T1
- **Wave 2**: S1-P1-T2, S1-P1-T3, S1-P2-T2, S1-P3-T2
- **Wave 3**: S1-P1-T4, S1-P2-T3, S1-P3-T3
- **Wave 4**: S1-P2-T4, S1-P3-T4, S1-P4-T2
- **Wave 5**: S1-P3-T5, S1-P4-T1
- **Wave 6**: S1-P4-T3
