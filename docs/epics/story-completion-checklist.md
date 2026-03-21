# Story Completion Checklist

**Purpose:** Ensure stories are properly completed with all work done, tested, and documented before marking as "done".

**When to use:** Before marking any story as "done" in sprint-status.yaml

---

## ✅ Story Completion Checklist

### 1. Implementation

- [ ] All acceptance criteria met (AC-1, AC-2, etc.)
- [ ] All tasks/subtasks checked off in story file
- [ ] Code follows project standards (project-context.md)
- [ ] Code reviewed and approved
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)

### 2. Testing

- [ ] Unit tests written and passing
- [ ] Tests co-located with source files (`.test.ts`)
- [ ] Component tests passing (if UI work)
- [ ] E2E test added for user flow (if applicable)
- [ ] All tests pass 100% (`npm test`)
- [ ] Test coverage adequate (>80% for new code)

### 3. Documentation

- [ ] Story file status updated to `done`
- [ ] Story file "Dev Agent Record" section populated
  - [ ] Implementation plan filled out
  - [ ] Completion notes written
  - [ ] File list populated
  - [ ] Change log completed
- [ ] Timestamp updated (completed date)
- [ ] README updated (if feature visible to users)
- [ ] Architecture doc updated (if system design changed)

### 4. Sprint-Status

- [ ] `sprint-status.yaml` updated
- [ ] Story marked as `done`
- [ ] Changes committed to git
- [ ] Changes pushed to remote

---

## ⚠️ Important Rules

**Mark story as DONE only when checklist complete.**

If checklist incomplete:
- Keep status as `in-progress` or `review`
- Document what's blocking completion
- Get help if stuck
- Never skip testing or documentation

---

## 📝 Story File Template (Dev Agent Record)

When completing a story, populate this section:

```markdown
## Dev Agent Record

### Implementation Plan

[Describe what you implemented and how]

Example:
"Implemented authentication dev mode bypass in 3 places:
1. API middleware - skip JWT validation if NODE_ENV=development
2. UI LoginPage - added 'Skip Login (Dev Mode)' button
3. Tests - updated to use dev mode bypass"

### Debug Log

[Document any issues encountered and how you solved them]

Example:
"Issue: Tests failing due to authentication. 
Solution: Added isDevModeAuth() utility function that checks NODE_ENV."

### Completion Notes

[Summary of what was delivered]

Example:
"Successfully implemented dev mode authentication bypass.
- API: 3 endpoints updated
- UI: Skip login button added  
- Tests: 45 e2e tests now passing
All acceptance criteria met."
```

---

## 🔄 Process Flow

1. **Start story**
   - Mark as `in-progress` in sprint-status.yaml
   - Read story file thoroughly
   - Review related docs (architecture, project-context)

2. **During development**
   - Follow project standards
   - Write tests alongside code
   - Update story file Dev Agent Record as you go

3. **Before marking done**
   - Run through this checklist
   - Ensure all items checked
   - Get code review if needed

4. **Mark as done**
   - Update story file status to `done`
   - Update sprint-status.yaml to `done`
   - Commit and push

---

## 📊 Story Completion Report Template

Add this to story file completion notes:

```markdown
Successfully completed Story X.X-X: [Title]

**Acceptance Criteria Met:**
- ✅ AC-1: [Description]
- ✅ AC-2: [Description]
- ✅ AC-3: [Description]

**Files Modified/Created:**
- [File 1] - [What changed]
- [File 2] - [What changed]

**Tests Added:**
- [Test file 1] - [What it tests]

**Test Results:**
- Unit tests: XXX passing
- E2E tests: XXX passing
- Overall: X% pass rate

**Documentation Updated:**
- [x] Story file
- [x] sprint-status.yaml
- [ ] README (not needed)
- [ ] Architecture (not needed)

**Known Issues:**
- None

**Story Status:** ✅ DONE
```

---

## 🎯 Common Mistakes to Avoid

**Don't:**
- ❌ Mark done without tests
- ❌ Skip documentation updates
- ❌ Forget to update sprint-status.yaml
- ❌ Leave TypeScript/ESLint errors
- ❌ Skip code review
- ❌ Forget to push changes

**Do:**
- ✅ Follow checklist completely
- ✅ Write tests first (TDD)
- ✅ Update docs in real-time
- ✅ Ask for help if stuck
- ✅ Celebrate when done! 🎉

---

**Last Updated:** 2026-01-02  
**Owner:** Development Team  
**Review Frequency:** After each story completion
