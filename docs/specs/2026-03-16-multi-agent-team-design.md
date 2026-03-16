# Multi-Agent Development Team — Design Spec

**Date:** 2026-03-16
**Status:** draft

---

## Overview

A four-agent development team for the diagram_builder project. Agents work autonomously on discrete roles, coordinate through a shared artifact system, and maintain per-agent working memory. The manager agent sequences work and surfaces blockers to Brian.

---

## Artifact Structure

All project artifacts live under `docs/` in the repository. Existing `specs/` and `plans/` directories are preserved unchanged. New directories:

```
docs/
  epics/            E{N}.md — epic definitions
  stories/          {epic}-{story}-{slug}.md — story files
  sprints/          sprint-{N}.md — sprint files
  specs/            design specs (existing)
  plans/            implementation plans (existing)
  agents/
    dev/            developer agent working memory (*.md, free-form)
    ops/            operations agent working memory
    architect/      architect agent working memory
    manager/        manager agent working memory
```

### Story Frontmatter Schema

All story files use YAML frontmatter so agents can query state via grep/glob:

```yaml
---
id: "{epic}-{N}"
epic: "E{N}"
title: "Short imperative title"
status: pending       # pending | in-progress | review | done | blocked
assigned-to: dev      # dev | ops | architect | manager
sprint: S{N}
priority: high        # critical | high | medium | low
blocked-by: []        # list of story IDs blocking this one
tags: []
---
```

### Epic Frontmatter Schema

```yaml
---
id: "E{N}"
title: "Epic title"
status: active        # active | complete | planned
phase: "Phase N"
goal: "One-line goal"
---
```

### Sprint Frontmatter Schema

```yaml
---
id: "S{N}"
status: active        # active | planned | complete
start: YYYY-MM-DD
end: YYYY-MM-DD
goal: "Sprint goal"
---
```

### Agent Memory

Each agent owns a directory at `docs/agents/{agent-name}/`. Files are free-form markdown — no schema enforced. Agents create whatever files they need: per-task scratchpads, running notes, working hypotheses, partial findings. All files are committed to git so state survives session restarts.

---

## Agent Roles

### Developer (`dev`)

**Purpose:** Implement stories.

**Workflow:**
1. Reads assigned story from `docs/stories/`
2. Checks `blocked-by` — stops if any blocker is not `done`
3. Implements code using TDD (superpowers:test-driven-development)
4. Updates story frontmatter: `pending → in-progress → review`
5. Commits code with story ID in commit message
6. Creates task breakdowns in `docs/agents/dev/` when needed

**Outputs:** Working code, passing tests, story at `review` status.

---

### Operations (`ops`)

**Purpose:** Validate completed work — testing, debugging, runtime verification.

**Workflow:**
1. Picks up stories at `review` status
2. Runs test suite for affected packages
3. Starts dev server, checks for runtime errors
4. Verifies acceptance criteria from the story
5. Updates story: `review → done` (pass) or `review → in-progress` (fail, with findings)
6. Writes findings to `docs/agents/ops/`

**Outputs:** Validated stories, test reports, runtime error findings.

---

### Architect (`architect`)

**Purpose:** Design, plan, and maintain project documentation.

**Workflow:**
1. Creates and maintains epics (`docs/epics/`), design specs (`docs/specs/`), and implementation plans (`docs/plans/`)
2. Reviews completed epics for stale or missing documentation
3. Audits `_bmad-output/` — migrates relevant artifacts into `docs/`, marks others archived
4. Writes new phase designs using brainstorming + writing-plans workflow
5. Ensures plans and specs stay aligned as implementation progresses

**Outputs:** Epics, specs, plans, story definitions, doc audit results.

---

### Manager (`manager`)

**Purpose:** Coordinate and sequence the other agents. Surface blockers to Brian.

**Workflow:**
1. Scans `docs/stories/` frontmatter to build current sprint state
2. Identifies ready work (status: `pending`, no unresolved `blocked-by`)
3. Identifies blockers (status: `blocked`) — surfaces to Brian before dispatching
4. Dispatches dev/ops/architect subagents with precise task context
5. Updates `docs/sprints/current.md` with progress
6. Creates/closes sprints as needed
7. Writes coordination decisions to `docs/agents/manager/`

**Parallelism rules:**
- Dev and Architect can run in parallel (independent concerns)
- Ops runs after Dev (needs completed code)
- Multiple Dev agents can run in parallel on independent stories
- Manager dispatches and moves on — does not wait synchronously

**Outputs:** Sprint state, dispatch decisions, blocker reports.

---

## Story Lifecycle

```
pending
  └─► in-progress   (dev picks up, begins implementation)
        └─► review  (dev commits, ready for ops validation)
              ├─► done     (ops validates — AC met, tests pass)
              └─► in-progress  (ops rejects — with findings written to ops memory)

Any status → blocked  (agent sets blocked-by + reason in agent memory)
                └─► manager surfaces to Brian on next invocation
```

---

## Coordination Flow

Brian invokes the manager. Manager reads sprint state and decides what runs next.

```
Brian → Manager
         ├── scan docs/stories/ frontmatter
         ├── surface any blocked stories to Brian first
         ├── identify ready stories (pending, unblocked)
         ├── dispatch dev / ops / architect as needed
         └── update docs/agents/manager/ with decisions
```

Agents never invoke each other directly. All coordination flows through shared artifact state (story frontmatter) and the manager.

---

## Sprint Cadence

1. Manager creates `docs/sprints/sprint-{N}.md` with goal and story list
2. Updates `docs/sprints/current.md` as a pointer to the active sprint
3. Architect populates backlog stories from epics in priority order
4. Manager closes sprint when all stories reach `done` or `blocked`
5. Retrospective notes written to sprint file before closing

---

## Migration from `_bmad-output/`

The existing `_bmad-output/` artifacts use a compatible story format. The Architect agent is responsible for:

1. Auditing all files in `_bmad-output/implementation-artifacts/`
2. Stories that are `done` or `complete` → archive in place (add `archived: true` to frontmatter)
3. Stories still relevant → migrate to `docs/stories/` with updated frontmatter schema
4. Epic files → migrate to `docs/epics/`
5. PRD, architecture, UX docs → copy to `docs/specs/` if not already present

---

## Open Questions

- Should `docs/sprints/current.md` be a symlink or a file containing the sprint ID?
- How should the manager handle a sprint where the architect is still writing stories — partial sprint start?
- Should ops have access to a running dev server, or test only via `vitest`?
