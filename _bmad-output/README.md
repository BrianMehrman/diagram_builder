# _bmad-output Documentation

This directory contains all project planning and implementation documentation for Diagram Builder.

## 📁 Folder Structure

```
_bmad-output/
├── planning-artifacts/          # Strategic planning documents
│   ├── architecture.md          # Technical architecture and ADRs
│   ├── prd.md                   # Product requirements document
│   ├── sprint-change-*.md       # Sprint change proposals
│   └── ux-*.md                  # UX specifications
│
├── implementation-artifacts/    # Tactical implementation tracking
│   ├── sprint-status.yaml       # Current sprint progress
│   ├── 3-*.md                   # Epic 3 stories (Parser Package)
│   ├── 4-*.md                   # Epic 4 stories (API Package)
│   ├── 5-*.md                   # Epic 5 stories (UI Package)
│   └── 5.5-*.md                 # Epic 5.5 stories (Foundation Cleanup)
│
├── project-context.md           # Critical rules and conventions (MUST READ)
└── README.md                    # This file
```

## 📋 Document Types

### Planning Artifacts

Strategic documents that define **what** to build and **how** to build it.

#### architecture.md
- **Purpose**: Technical architecture and design decisions
- **Contains**: System design, technology stack, data models, API specs, deployment architecture
- **Read when**: Before implementing any feature, understanding system design, debugging integration issues
- **Update when**: System design changes, new integrations, API changes, data model changes

#### prd.md
- **Purpose**: Product Requirements Document
- **Contains**: 72 functional requirements, 76 non-functional requirements, user stories, success criteria
- **Read when**: Understanding product requirements, validating features, planning new features
- **Update when**: Product requirements change, new features added

#### sprint-change-proposal-YYYY-MM-DD.md
- **Purpose**: Document sprint plan changes
- **Contains**: Issue analysis, impact assessment, new stories, implementation handoff
- **Read when**: Understanding recent changes, reviewing approved features
- **Created**: Via `correct-course` workflow when requirements change

#### ux-*.md
- **Purpose**: UX specifications for features
- **Contains**: User flows, UI component specs, validation requirements, visual design
- **Read when**: Before implementing UI features, understanding UX requirements
- **Created**: Before UI story implementation begins

### Implementation Artifacts

Tactical documents that track **progress** and detail **implementation**.

#### sprint-status.yaml
- **Purpose**: Real-time sprint progress tracking
- **Contains**: Epic status, story status (not-started → in-progress → review → done), current sprint info
- **Read when**: **ALWAYS** at start of work session
- **Update when**: Story status changes (starting work, completing work, marking as review/done)
- **Critical**: Never skip status updates, preserve all comments and structure

#### Story Files: {epic}-{story}-{name}.md
- **Format**: `3-4-repository-integration.md`, `5-15-codebase-import-ui.md`
- **Purpose**: Detailed story requirements and implementation tracking
- **Contains**:
  - User story (As a... I want... so that...)
  - Acceptance criteria
  - Tasks and subtasks
  - Dev notes and technical requirements
  - Dev agent record (implementation notes, file list, completion notes)
- **Read when**: Before starting story implementation, during code review
- **Update when**: During implementation (dev notes), after completion (completion notes, file list)
- **Created**: Via `create-story` workflow from backlog

### Root Level Documents

#### project-context.md
- **Purpose**: Critical project rules and conventions (MUST READ for all developers)
- **Contains**:
  - Architecture rules (state management, organization, naming)
  - Error handling patterns
  - Testing requirements
  - Code organization patterns
  - Security guidelines
- **Read when**: **ALWAYS** before writing code
- **Update when**: Conventions evolve, new patterns established

## 🔄 Documentation Lifecycle

### Creation

- **Planning docs**: Created during sprint planning or via workflows
- **Story files**: Generated via `create-story` workflow from backlog
- **Change proposals**: Created via `correct-course` workflow
- **UX specs**: Created before UI story implementation

### Updates

- **sprint-status.yaml**: Updated immediately when story status changes
- **Story files**: Dev agent populates during and after implementation
- **architecture.md**: Updated when system design changes
- **project-context.md**: Updated when conventions evolve
- **PRD**: Updated when product requirements change

### Source of Truth

| Topic | Document |
|-------|----------|
| Sprint progress | `sprint-status.yaml` |
| Story requirements | Individual story files |
| Technical design | `architecture.md` |
| Project rules | `project-context.md` |
| Product requirements | `prd.md` |

## 📝 File Naming Conventions

### Sprint Changes
Format: `sprint-change-proposal-YYYY-MM-DD.md`

Example: `sprint-change-proposal-2026-01-01.md`

### Story Files
Format: `{epic}-{story}-{short-name}.md`

Examples:
- `3-4-repository-integration.md` (Epic 3, Story 4)
- `4-14-codebase-import-api.md` (Epic 4, Story 14)
- `5-15-codebase-import-ui.md` (Epic 5, Story 15)
- `5.5-3-e2e-test-validation.md` (Epic 5.5, Story 3)

### UX Specifications
Format: `ux-{feature-name}.md`

Example: `ux-codebase-import.md`

## 🎯 Common Workflows

### Starting a New Work Session

1. Read `../PLANNING.md` for navigation
2. Check `sprint-status.yaml` for current state
3. Read story file if working on specific story
4. Review `project-context.md` for critical rules

### Implementing a Story

1. Find story in `sprint-status.yaml`
2. Read story file: `implementation-artifacts/{epic}-{story}-{name}.md`
3. Review related architecture sections
4. Update `sprint-status.yaml` to `in-progress`
5. Implement following `project-context.md` rules
6. Update story file with dev notes and completion info
7. Update `sprint-status.yaml` to `review` or `done`

### Handling Changes

1. Run `correct-course` workflow
2. Review generated proposal in `planning-artifacts/sprint-change-proposal-{date}.md`
3. If approved, update `sprint-status.yaml` with new stories
4. Update architecture if needed
5. Create UX specs if needed

## 🔍 Quick Find

### "Where do I find...?"

| Looking for | Location |
|-------------|----------|
| Current sprint status | `implementation-artifacts/sprint-status.yaml` |
| Story requirements | `implementation-artifacts/{epic}-{story}-*.md` |
| System architecture | `planning-artifacts/architecture.md` |
| Product requirements | `planning-artifacts/prd.md` |
| Critical rules | `project-context.md` |
| Recent changes | `planning-artifacts/sprint-change-proposal-*.md` |
| UX specs | `planning-artifacts/ux-*.md` |
| Epic 3 stories | `implementation-artifacts/3-*.md` |
| Epic 4 stories | `implementation-artifacts/4-*.md` |
| Epic 5 stories | `implementation-artifacts/5-*.md` |

### "When do I update...?"

| Document | When to Update |
|----------|---------------|
| `sprint-status.yaml` | Story status changes |
| Story files | During and after implementation |
| `architecture.md` | System design changes |
| `project-context.md` | Conventions evolve |
| `prd.md` | Requirements change |

## 📚 Related Documentation

- **[Root README](../README.md)** - Project overview and quick start
- **[PLANNING.md](../PLANNING.md)** - Documentation navigation guide
- **[CLAUDE.md](../CLAUDE.md)** - LLM context loading instructions
- **[TASKS.md](../TASKS.md)** - Detailed task tracking

---

**Last Updated:** 2026-01-02  
**Documentation Standard:** Living documentation - updates in real-time as project evolves
