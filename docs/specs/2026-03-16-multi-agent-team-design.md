# Multi-Agent Development Team — Design Spec

**Date:** 2026-03-16
**Status:** draft

---

## Overview

A four-agent development team for the diagram_builder project. Agents work autonomously on discrete roles, coordinate through a shared artifact system, and maintain per-agent working memory. The manager agent sequences work and surfaces blockers to Brian.

---

## Artifact Structure

Everything lives under `docs/` in the repository. Existing `specs/` and `plans/` directories are preserved. New directories:

```
docs/
  epics/            E{N}.md — epic definitions
  stories/          {epic}-{N}-{slug}.md — story files
  sprints/          sprint-{N}.md, current.md (plain file with active sprint ID)
  specs/            design specs (existing)
  plans/            implementation plans (existing)
  agents/
    dev/            developer agent working memory (*.md, free-form)
    ops/            operations agent working memory
    architect/      architect agent working memory
    manager/        manager agent working memory
```

### Story Frontmatter Schema

```yaml
---
id: "{epic}-{N}"
epic: "E{N}"
title: "Short imperative title"
type: code           # code | docs — docs stories skip ops validation
status: pending      # pending | in-progress | review | done | blocked
assigned-to: unassigned  # unassigned | dev | ops | architect | manager
sprint: S{N}
priority: high       # critical | high | medium | low
blocked-by: []       # story IDs that must be done before this one can start
tags: []             # optional: [api, canvas, ui, parser, infra, ...]
---
```

### Epic Frontmatter Schema

```yaml
---
id: "E{N}"
title: "Epic title"
status: active       # active | complete | planned | blocked
phase: "Phase N"
goal: "One-line goal"
---
```

### Sprint Frontmatter Schema

```yaml
---
id: "S{N}"
status: active       # active | planned | complete
start: YYYY-MM-DD
end: YYYY-MM-DD
goal: "Sprint goal"
stories: []          # convenience index — canonical membership is the story's own sprint: field
---
```

`docs/sprints/current.md` is a plain text file containing only the active sprint ID (e.g., `S3`). Not a symlink — symlinks have git portability issues. Manager updates this file when opening or closing a sprint.

### Agent Memory

Each agent owns `docs/agents/{agent-name}/`. Files are free-form markdown — no schema enforced. Agents create whatever files they need: per-task scratchpads, running notes, working hypotheses. All files are committed to git so state survives session restarts. Agents should periodically archive old working files by moving them to `docs/agents/{agent-name}/archive/`.

---

## Agent Roles

### Developer (`dev`)

**Purpose:** Implement code stories.

**Workflow:**
1. Reads assigned story (provided by manager in dispatch prompt — not self-assigned)
2. Checks `blocked-by` — stops and writes blocker report if any blocker is not `done`
3. Sets story `status: in-progress` in frontmatter (manager already set this on dispatch — dev confirms)
4. Implements code using TDD
5. Updates story `status: review`, commits code with story ID in commit message
6. Creates task breakdowns in `docs/agents/dev/` when a story is too large for one pass

**Outputs:** Working code, passing tests, story at `review` status.

---

### Operations (`ops`)

**Purpose:** Validate completed code stories — testing, debugging, runtime verification.

**Workflow:**
1. Reads assigned story (provided by manager — not self-assigned)
2. Runs test suite for affected packages: `cd packages/{pkg} && npx vitest run`
3. Starts dev server, verifies process doesn't crash within 10 seconds (startup check only)
4. If story acceptance criteria require UI verification, uses Playwright for browser-level checks
5. Verifies each acceptance criterion from the story is met
6. Updates story: `review → done` (all AC met, tests pass) or `review → in-progress` (failed, with findings)
7. Writes findings to `docs/agents/ops/{story-id}-report.md`

**Note:** `type: docs` stories skip ops entirely — manager routes them directly to `done` after architect review.

**Outputs:** Validated stories, test/runtime reports in ops agent memory.

---

### Architect (`architect`)

**Purpose:** Design, plan, and maintain project documentation and the story backlog.

**Task priority order (manager dispatches with a specific task type):**
1. **Write stories** for a specified epic — highest priority when dev backlog is empty
2. **Write spec + plan** for a new phase — triggered when current epic nears completion
3. **Audit docs** — review completed epics for stale artifacts, clean up `_bmad-output/` migration
4. **Review alignment** — verify existing plans/specs match current implementation

**Workflow (per task type):**
- *Write stories:* Creates story files in `docs/stories/` with full acceptance criteria and task breakdowns
- *Write spec + plan:* Follows brainstorming → spec → plan workflow; writes to `docs/specs/` and `docs/plans/`
- *Audit docs:* Scans `_bmad-output/` and `docs/`; migrates, archives, or flags stale content
- *Review alignment:* Reads recent commits + current specs; flags drift in `docs/agents/architect/`

**Outputs:** Story files, epics, specs, plans, audit reports.

---

### Manager (`manager`)

**Purpose:** Coordinate and sequence agents. Surface blockers to Brian.

**Workflow:**
1. Reads `docs/sprints/current.md` to get the active sprint ID
2. Scans `docs/stories/` frontmatter for all stories in the active sprint
3. **Surfaces blockers first** — reports any `status: blocked` stories to Brian before dispatching
4. Identifies ready stories: `status: pending`, all `blocked-by` entries are `done`
5. Sets `status: in-progress` and `assigned-to: {agent}` in story frontmatter before dispatching
6. Dispatches agents as subagents with full task context (see Dispatch Mechanism below)
7. After dispatch completes, re-scans sprint state and updates `docs/agents/manager/sprint-log.md`
8. Creates/closes sprints as needed

**Parallelism rules:**
- Dev and Architect run in parallel (independent concerns, different files)
- Multiple Dev agents run in parallel on independent stories
- Ops runs after Dev (needs completed code)
- Manager sets `in-progress` before dispatching — this is the only write to `pending` stories, preventing race conditions

**Unblock flow:**
When a story is `blocked`, the manager writes a blocker report and surfaces it to Brian. Brian resolves the blocker and tells the manager. Manager clears `blocked-by`, resets `status` to either `pending` (not yet started) or `in-progress` (was mid-implementation), and resumes dispatch.

**Outputs:** Sprint state, dispatch decisions, blocker reports in `docs/agents/manager/`.

---

## Dispatch Mechanism

The manager dispatches agents as Claude Code subagents. Each dispatch prompt includes:
- The full path to the story file
- Relevant file paths (from the story's task list)
- The agent's working memory directory path (`docs/agents/{agent}/`)
- The sprint ID and any relevant context from the manager's working memory

The manager does NOT pass its own session history — context is constructed fresh from artifact files each time.

---

## Story Lifecycle

```
pending
  └─► in-progress   (manager sets before dispatch; dev confirms)
        └─► review  (dev commits, updates frontmatter)
              ├─► done        (ops validates — AC met, tests pass)
              │               (docs stories: manager sets done directly)
              └─► in-progress (ops rejects — findings in ops memory)

Any status → blocked
  ├── agent sets blocked-by + reason in agent memory
  ├── manager surfaces to Brian on next invocation
  └── Brian resolves → manager clears blocked-by
        ├── was pending     → reset to pending
        └── was in-progress → reset to in-progress
```

---

## Coordination Flow

```
Brian → Manager
         ├── read current sprint ID
         ├── scan story frontmatter for sprint stories
         ├── surface blocked stories to Brian (stop if any)
         ├── set in-progress + assigned-to on ready stories
         ├── dispatch dev / ops / architect as subagents
         └── update docs/agents/manager/sprint-log.md
```

Agents never invoke each other directly. All coordination flows through shared artifact state (frontmatter) and the manager.

---

## Sprint Cadence

1. Manager creates `docs/sprints/sprint-{N}.md` with goal and story list
2. Writes sprint ID to `docs/sprints/current.md`
3. Architect populates stories from epics in priority order — sprint can start before all stories are written (architect adds stories mid-sprint with the correct sprint ID)
4. Manager closes sprint when all stories are `done` or `blocked` (blocked ones carry to next sprint)
5. Manager writes retrospective notes to sprint file before closing

---

## Migration from `_bmad-output/`

The existing BMAD artifacts use a structurally similar but syntactically different format — fields are inline markdown (`**ID:** 5-1`) rather than YAML frontmatter. Migration requires extracting inline fields and rewriting them as YAML. The Architect agent is responsible:

1. Scan `_bmad-output/implementation-artifacts/` for all story files
2. Stories with `Status: complete` or `Status: done` → add `archived: true` to frontmatter, leave in place
3. Stories still relevant (pending, in-progress, review) → migrate to `docs/stories/` with YAML frontmatter schema above
4. Epic files → migrate to `docs/epics/`
5. PRD, architecture, UX docs → copy to `docs/specs/` if not already present

---

## Open Questions

None — all resolved in this spec.
