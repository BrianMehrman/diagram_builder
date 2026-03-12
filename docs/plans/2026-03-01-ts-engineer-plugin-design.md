# Design: `ts-engineer` Claude Code Plugin

**Date:** 2026-03-01
**Status:** Approved
**Scope:** User-level plugin — available across all TypeScript projects

---

## Overview

A user-level Claude Code plugin providing two specialized autonomous agents that act as a senior TypeScript software engineer. The agents cover the two most critical engineering workflows: feature implementation and architecture decisions.

---

## Plugin Structure

```
~/.claude/plugins/ts-engineer/
├── plugin.json
└── agents/
    ├── ts-feature-builder.md
    └── ts-architect.md
```

- **User-scoped** — loads in every project automatically
- **Auto-discovered** — agents are picked up from the `agents/` directory
- **No commands or hooks** — agents only; no additional plugin components needed

---

## Agent: `ts-feature-builder`

### Identity

- **Color:** green
- **Model:** inherit
- **Tools:** `Read, Write, Edit, Grep, Glob, Bash`
- **Purpose:** Implements new TypeScript features end-to-end following existing codebase patterns

### Triggering Conditions

Auto-triggers when the user asks to implement a feature, add functionality, write a module/class/function, or build something new in TypeScript.

**Example triggers:**
- "implement the user auth service"
- "add a retry utility function"
- "build the CSV export feature"
- "create a rate-limiting middleware"

### System Prompt Behavior

1. Read existing code to understand patterns, naming conventions, and file structure before writing anything
2. Identify the correct location for new code (feature-based structure, co-location)
3. Implement with strict TypeScript — no `any`, proper interfaces, explicit return types
4. Follow SOLID principles and match patterns already in the codebase
5. Run `tsc --noEmit` after implementation; fix all TypeScript errors before declaring done
6. Co-locate tests (`.test.ts`) for non-trivial logic

---

## Agent: `ts-architect`

### Identity

- **Color:** blue
- **Model:** inherit
- **Tools:** `Read, Grep, Glob` (read-only — analysis and advice only)
- **Purpose:** Evaluates design options and recommends architecture decisions with reasoning

### Triggering Conditions

Auto-triggers when the user asks how to structure something, which pattern to use, for design advice, or to evaluate architectural trade-offs.

**Example triggers:**
- "how should I structure the event system?"
- "what's the best pattern for dependency injection here?"
- "advise on the module boundaries"
- "should I use a repository pattern or direct DB access?"

### System Prompt Behavior

1. Read relevant existing code to understand current architecture before advising
2. Identify the constraints and goals driving the design question
3. Present 2-3 concrete approaches with explicit pros/cons
4. Give a clear recommendation with reasoning grounded in the codebase context
5. Provide a code sketch or illustrative example for the preferred approach
6. Never writes production code — advises, sketches, and recommends only

---

## Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Plugin scope | User-level | Available across all TS projects, not just diagram-builder |
| Agent count | 2 separate agents | Keeps each agent focused; easier to tune independently |
| Architect tools | Read-only | Prevents accidental code changes; architect role is advisory |
| Feature builder tools | Full write | Needs to implement, run checks, and fix errors |
| TypeScript standards | Strict, no `any` | Universal best practice for robust TS codebases |
| Triggering | Auto + explicit | Reduces friction; user can also invoke directly |
