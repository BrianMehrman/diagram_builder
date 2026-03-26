# Planning & Sprint Documentation

**Project:** diagram_builder - 3D Codebase Visualization Tool

> Start here when you need to find planning information or understand the project structure.

---

## Where to Find Things

| What you need | Where to look |
|---|---|
| Product requirements | `docs/prd.md` |
| Technical architecture | `docs/architecture.md` |
| Critical rules & conventions | `docs/project-context.md` |
| Current sprint state | `docs/sprints/sprint-status.yaml` |
| Story details | `docs/epics/epic-N/stories/N-M-name.md` |
| Granular task tracking | `TASKS.md` |
| Design & UX specs | `docs/specs/` |
| Implementation plans | `docs/plans/` |
| Research & brainstorming | `docs/research/` |
| Change proposals | `docs/sprints/sprint-change-proposal-YYYY-MM-DD.md` |

---

## What to Read and When

**`docs/project-context.md`** — Read this before writing any code. It contains naming conventions, state management rules, error handling patterns, and testing requirements. These are non-negotiable.

**`docs/architecture.md`** — Read before implementing any feature. Understand how the system fits together before touching it.

**`docs/sprints/sprint-status.yaml`** — Check at the start of every work session. Update it whenever a story status changes. This is the source of truth for what's in progress, done, or blocked.

**Story files** (`docs/epics/epic-N/stories/N-M-name.md`) — Read before starting a story. Update them with dev notes and completion status during and after implementation.

**`docs/specs/`** — Read before implementing UI features or significant new functionality. Specs contain design decisions and technical approach that aren't in the story files.

**`docs/prd.md`** — Read when you need to understand original intent or validate a feature against requirements.

---

## Common Workflows

### Starting a Work Session
1. Check `docs/sprints/sprint-status.yaml` for current state
2. If working on a story, read its file from `docs/epics/`
3. Review `docs/project-context.md` if anything is unclear

### Implementing a Story
1. Find the story in `sprint-status.yaml` (status: `backlog` or `ready-for-dev`)
2. Read the story file: `docs/epics/epic-N/stories/N-M-name.md`
3. Check `docs/specs/` for any relevant design spec
4. Mark story `in-progress` in `sprint-status.yaml`
5. Implement following `docs/project-context.md` rules
6. Mark tasks `[x]` in `TASKS.md` as you go
7. Mark story `review` in `sprint-status.yaml` when complete

### Adding New Requirements
1. Create a change proposal: `docs/sprints/sprint-change-proposal-YYYY-MM-DD.md`
2. When approved, add stories to `sprint-status.yaml`
3. Create story files at `docs/epics/epic-N/stories/`
4. Add tasks to `TASKS.md`
5. Create a spec in `docs/specs/` if design work is needed

---

## Story Status Values

| Status | Meaning |
|---|---|
| `not-started` | Story exists, work hasn't begun |
| `backlog` | Ready to be picked up |
| `ready-for-dev` | Validated and ready for implementation |
| `in-progress` | Actively being worked on |
| `review` | Complete, awaiting code review |
| `done` | Code review passed |
| `blocked` | Waiting on a dependency |

---

## File Naming Conventions

- Stories: `{epic}-{story}-{short-name}.md` → `docs/epics/epic-4/stories/4-14-codebase-import-api.md`
- Specs: `YYYY-MM-DD-{feature}-design.md` and `YYYY-MM-DD-{feature}-plan.md` → `docs/specs/`
- Plans: `YYYY-MM-DD-{description}.md` → `docs/plans/`
- Change proposals: `sprint-change-proposal-YYYY-MM-DD.md` → `docs/sprints/`

---

## Critical Rules

- **Never** skip updating `sprint-status.yaml` when a story status changes
- **Always** read `docs/project-context.md` before writing code
- **Always** read `docs/architecture.md` before implementing a feature
- **Never** use `any` types in TypeScript
- **Always** write co-located tests (`.test.ts` next to source)

---

**Last Updated:** 2026-03-25
**Current State:** Epic 12 complete. See `docs/sprints/sprint-status.yaml` for authoritative status.
