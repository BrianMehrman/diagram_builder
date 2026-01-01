# Planning & Sprint Documentation Index

**Project:** diagram_builder - 3D Codebase Visualization Tool
**Last Updated:** 2026-01-01

> **Purpose:** This document serves as the **entry point** for all planning, sprint, and architecture documentation. Any LLM working on this project should start here to understand where to find critical project information.

---

## 📚 Quick Navigation

### For Product/Requirements Understanding
- **PRD (Product Requirements Document)** → `_bmad-output/planning-artifacts/prd.md`
- **Architecture Decisions** → `_bmad-output/planning-artifacts/architecture.md`
- **Project Context (Brownfield Docs)** → `_bmad-output/project-context.md`

### For Sprint Planning & Tracking
- **Current Sprint Status** → `_bmad-output/implementation-artifacts/sprint-status.yaml`
- **Implementation Tasks** → `TASKS.md` (root directory)
- **Epics & Stories** → `_bmad-output/implementation-artifacts/` (story files: `{epic}-{story}-{name}.md`)

### For Changes & Proposals
- **Change Proposals** → `_bmad-output/planning-artifacts/sprint-change-proposal-{date}.md`
- **Latest Change**: `sprint-change-proposal-2026-01-01.md` (Codebase Import Feature)

### For UX/Design
- **UX Specifications** → `_bmad-output/planning-artifacts/ux-*.md`
- **Latest UX Spec**: To be created - `ux-codebase-import.md` (for stories 4-14, 5-15)

---

## 📋 Document Descriptions

### Planning Artifacts (`_bmad-output/planning-artifacts/`)

#### PRD (Product Requirements Document)
**Location:** `_bmad-output/planning-artifacts/prd.md`

**Contains:**
- Executive summary and product vision
- Target users and use cases
- 72 functional requirements (FR1-FR72)
- 76 non-functional requirements (NFR-P1 through NFR-SC17)
- User journeys (5 detailed scenarios)
- MVP scope and phased development plan
- Success criteria and metrics

**When to read:**
- Understanding product requirements
- Validating features against original intent
- Planning new features or changes

---

#### Architecture Document
**Location:** `_bmad-output/planning-artifacts/architecture.md`

**Contains:**
- Technical stack decisions (TypeScript, Neo4j, Three.js, React)
- System components and their interactions
- Data models and Neo4j schema
- API endpoint specifications
- Performance optimization strategies
- Deployment architecture (Docker, Kubernetes, Helm)
- Critical architectural decisions and rationale

**When to read:**
- Before implementing any feature
- Understanding system design
- Planning technical changes
- Debugging integration issues

---

#### Project Context
**Location:** `_bmad-output/project-context.md`

**Contains:**
- Critical architecture rules (MUST FOLLOW)
- Naming conventions (Neo4j, TypeScript, files)
- State management rules (Zustand only)
- Error handling patterns (RFC 7807)
- Testing requirements
- Code organization patterns (feature-based)

**When to read:**
- ALWAYS read before writing code
- Understanding project conventions
- Reviewing code for compliance

---

#### Sprint Change Proposals
**Location:** `_bmad-output/planning-artifacts/sprint-change-proposal-{date}.md`

**Latest:** `sprint-change-proposal-2026-01-01.md` - Codebase Import Feature

**Contains:**
- Issue analysis and root cause
- Epic and artifact impact assessment
- Detailed change proposals
- Implementation handoff plan
- Success criteria

**When to read:**
- Understanding recent changes to sprint
- Reviewing approved but not-yet-implemented features
- Planning implementation of new stories

---

#### UX Specifications
**Location:** `_bmad-output/planning-artifacts/ux-*.md`

**Current Files:**
- `ux-codebase-import.md` (TO BE CREATED - for stories 4-14, 5-15)

**Contains:**
- User flows and interaction design
- UI component specifications
- Input validation requirements
- Loading and error states
- Visual design guidance

**When to read:**
- Before implementing UI features
- Understanding user experience requirements
- Designing component interfaces

---

### Implementation Artifacts (`_bmad-output/implementation-artifacts/`)

#### Sprint Status
**Location:** `_bmad-output/implementation-artifacts/sprint-status.yaml`

**Contains:**
- Current sprint information
- Epic status tracking (epic-3, epic-4, epic-5)
- Story status tracking (by story key: `{epic}-{story}-{name}`)
- Status definitions:
  - `not-started`: Story exists but work hasn't begun
  - `backlog`: Story ready to be picked up
  - `ready-for-dev`: Story validated and ready for implementation
  - `in-progress`: Developer actively working on story
  - `review`: Implementation complete, awaiting code review
  - `done`: Code review passed, story complete
  - `blocked`: Story blocked by dependency or external issue

**When to read/update:**
- **ALWAYS** at start of work session (to know current sprint state)
- **ALWAYS** when starting a new story (mark `in-progress`)
- **ALWAYS** when completing a story (mark `done`)
- When planning next work
- When generating status reports

**Critical Rules:**
- Update immediately when story status changes
- Never skip status updates
- Preserve all comments and structure when editing

---

#### Story Files
**Location:** `_bmad-output/implementation-artifacts/{epic}-{story}-{name}.md`

**Format:** `{epic_number}-{story_number}-{story_name}.md`

**Examples:**
- `4-14-codebase-import-api.md`
- `5-15-codebase-import-ui.md`

**Contains:**
- User story (As a... I want... so that...)
- Acceptance criteria
- Tasks and subtasks
- Dev notes and technical requirements
- Project structure notes
- References to source documents
- Dev agent record (completion notes, file list)

**When to read:**
- Before starting implementation of a story
- Understanding story requirements
- During code review

**When to create:**
- Use `create-story` workflow to generate from epics
- Stories are created from backlog status in sprint-status.yaml

---

### Root Directory Documents

#### TASKS.md
**Location:** `TASKS.md` (project root)

**Contains:**
- Detailed implementation tasks organized by phase
- Checkbox tracking for each task
- Phase 1: Project Infrastructure
- Phase 2: Core Package
- Phase 3: Parser Package
- Phase 4: API Package (includes NEW story 4.14)
- Phase 5: UI Package (includes NEW story 5.15)
- Phase 6: CLI Package
- Phase 7: Integration & Performance
- Phase 8: Deployment
- Testing checklist
- Critical architecture rules reference

**When to read:**
- Understanding granular implementation tasks
- Tracking technical progress
- Planning development work

**When to update:**
- Mark tasks as complete `[x]` when finished
- Add new tasks when new stories are added
- Add verification tasks when needed

---

#### PLANNING.md (This Document)
**Location:** `PLANNING.md` (project root)

**Purpose:** Navigation index for all planning and sprint documentation

**When to read:**
- Start of any work session
- When unsure where to find planning information
- When onboarding to the project

---

## 🔄 Common Workflows

### Starting a New Work Session
1. Read `PLANNING.md` (this document) for navigation
2. Check `_bmad-output/implementation-artifacts/sprint-status.yaml` for current sprint state
3. Read story file from `_bmad-output/implementation-artifacts/` if working on specific story
4. Review `_bmad-output/project-context.md` for critical rules
5. Check `TASKS.md` for detailed task tracking

### Implementing a New Story
1. Find story in `sprint-status.yaml` with status `backlog` or `ready-for-dev`
2. Read story file `_bmad-output/implementation-artifacts/{epic}-{story}-{name}.md`
3. Review related sections in Architecture document
4. Review UX specification if UI story
5. Update `sprint-status.yaml` to mark story as `in-progress`
6. Implement following project-context.md rules
7. Update `TASKS.md` as tasks are completed
8. Update `sprint-status.yaml` to `review` when complete

### Handling Changes or New Requirements
1. Run `correct-course` workflow (creates sprint change proposal)
2. Review generated proposal in `_bmad-output/planning-artifacts/sprint-change-proposal-{date}.md`
3. If approved, update `sprint-status.yaml` with new stories
4. Add new tasks to `TASKS.md`
5. Update Architecture document if needed
6. Create UX specifications if needed

### Creating a New Story
1. Check if story is in `sprint-status.yaml` with status `backlog`
2. Run `create-story` workflow to generate story file
3. Story file created in `_bmad-output/implementation-artifacts/`
4. Add corresponding tasks to `TASKS.md`
5. Update `sprint-status.yaml` to `ready-for-dev` when story is complete

---

## 📊 Current Sprint State (as of 2026-01-01)

**Active Epics:**
- Epic 3 (Parser Package): `review` - **VERIFICATION NEEDED** for story 3-4
- Epic 4 (API Package): `in-progress` - **NEW STORY 4-14** added
- Epic 5 (UI Package): `in-progress` - **NEW STORY 5-15** added

**Recent Changes:**
- **2026-01-01**: Added stories 4-14 (Codebase Import API) and 5-15 (Codebase Import UI)
- **Priority**: HIGH - both stories unblock core application usage
- **Dependencies**: Story 5-15 depends on 4-14; both may need updates to 3-4

**Next Actions:**
1. Verify Epic 3 story 3-4 supports on-demand loading
2. Create UX specification: `ux-codebase-import.md`
3. Implement story 4-14 (API)
4. Implement story 5-15 (UI)
5. Update Architecture document with new endpoints and data model

---

## 🎯 Critical Reminders for LLMs

### Always Read These First
1. **project-context.md** - Contains MUST FOLLOW rules
2. **sprint-status.yaml** - Current sprint state
3. **architecture.md** - Before implementing features

### Always Update These
1. **sprint-status.yaml** - When story status changes
2. **TASKS.md** - When tasks are completed
3. **Story files** - Dev notes, completion status, file lists

### Never Skip
- Reading Architecture before implementation
- Following project-context.md rules
- Updating sprint-status.yaml status changes
- Writing tests (co-located with source)
- TypeScript strict mode (no `any`)

### Document Locations - Quick Reference
```
diagram_builder/
├── PLANNING.md                           ← YOU ARE HERE
├── TASKS.md                              ← Detailed task tracking
├── _bmad-output/
│   ├── planning-artifacts/
│   │   ├── prd.md                       ← Product requirements
│   │   ├── architecture.md              ← Technical architecture
│   │   ├── sprint-change-proposal-*.md  ← Change proposals
│   │   └── ux-*.md                      ← UX specifications
│   ├── implementation-artifacts/
│   │   ├── sprint-status.yaml           ← Current sprint state
│   │   └── {epic}-{story}-{name}.md     ← Story files
│   └── project-context.md               ← Critical rules
```

---

**For Questions or Clarifications:**
- Review the appropriate document from this index
- Check sprint change proposals for recent decisions
- Read Architecture Decision Records in architecture.md
- Consult PRD for original product intent

---

**Last Updated:** 2026-01-01
**Current Sprint:** Phase 4 (API Package) and Phase 5 (UI Package) with codebase import stories
**Status:** Active development
