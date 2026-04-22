# NEX Founder OS

Internal-first execution operating system for planning, execution tracking, memory, proof, verification, gates, and recovery across founder tools.

## Canonical Structure

- `docs/constitution/` — NEX constitution and platform blueprint
- `docs/sprints/` — sprint packs, gate rules, task graphs, audit notes
- `docs/architecture/` — schema and service spine
- `apps/founder-os/` — founder-facing Next.js application
- `packages/core/` — domain objects, laws, state machines, progress model
- `packages/ssot/` — persistent repositories, seed flows, and application services
- `packages/memory/` — reserved for Sprint 02

## Workspace Commands

- `pnpm install`
- `pnpm seed`
- `pnpm test`
- `pnpm build`
- `pnpm verify:sprint-01`

## Current Status

Sprint 02 implements the memory and truth spine on top of the Sprint 01 execution model.
