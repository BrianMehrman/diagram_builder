# Epic Closure Checklist

**Purpose:** Ensure epics are properly closed with all work complete and documented before moving to the next epic.

**When to use:** Before marking any epic as "done" in sprint-status.yaml

---

## ✅ Epic Closure Checklist

### 1. All Stories Complete

- [ ] All story files show `status: done`
- [ ] All story files have completion timestamps
- [ ] All story dev agent records populated (implementation plan, completion notes, file lists)
- [ ] All story tests passing 100%

### 2. Epic Validation

- [ ] E2E tests pass for all epic features
- [ ] Users can access all features via UI (if applicable)
- [ ] API endpoints working correctly (if applicable)
- [ ] Documentation updated for all new features
- [ ] No known critical bugs

### 3. Sprint-Status Updated

- [ ] All story statuses updated to done
- [ ] Epic status updated to done
- [ ] Epic retrospective marked (if conducted)
- [ ] Dependencies section updated

### 4. TASK.md Updated

- [ ] Epic checked off in phase list
- [ ] Progress percentage updated
- [ ] Tasks marked as complete `[x]`

### 5. Dependencies Resolved

- [ ] No blocking issues for next epic
- [ ] All prerequisites for next epic met
- [ ] Clean handoff state
- [ ] Technical debt documented (if any)

### 6. Knowledge Transfer

- [ ] README updated (if needed)
- [ ] Architecture document updated (if needed)
- [ ] Team trained on new features
- [ ] Runbook/troubleshooting docs created (if needed)

---

## ⚠️ Important Rules

**Mark epic as DONE only when ALL criteria met.**

If any criteria not met:
1. Mark epic as `review` in sprint-status.yaml
2. Create follow-up stories for missing items
3. Document blockers clearly
4. Get team agreement on acceptance

---

## 📝 Example Epic Closure

**Epic 5: UI Package**

```yaml
# Before closure - verify:
✓ 15/15 stories done
✓ E2E tests: 147/153 passing (96.1%) - exceeds 95% target
✓ All UI features accessible
✓ API integration working
✓ Documentation updated (README, architecture)
✓ sprint-status.yaml updated
✓ TASK.md phase 5 checked off
✓ No blockers for Epic 6
✓ Team trained on new UI features

# Mark in sprint-status.yaml:
epic-5: done
```

---

## 🔄 Process Flow

1. **Developer** completes last story in epic
2. **Developer** runs through checklist items 1-4
3. **Tech Lead** validates items 2 and 5
4. **Scrum Master** validates items 3 and 6
5. **Team** agrees epic is complete
6. **Update** sprint-status.yaml: `epic-X: done`
7. **Commit** and push changes
8. **Celebrate** 🎉

---

## 📊 Epic Completion Report Template

Use this template when closing an epic:

```markdown
# Epic X Completion Report

**Epic:** [Name]
**Completion Date:** [Date]
**Stories Completed:** X/X (100%)

## Deliverables
- [Feature 1]
- [Feature 2]
- [Feature 3]

## Metrics
- Stories completed: X/X
- Tests passing: XX% (XXX/XXX)
- Lines of code: +XXX, -XXX
- Test coverage: XX%

## Known Issues
- [Issue 1 - documented in technical debt log]
- [Issue 2 - follow-up story created]

## Next Epic Prerequisites Met
- [x] Prerequisite 1
- [x] Prerequisite 2
- [x] Prerequisite 3

**Epic Status:** ✅ CLOSED
**Next Epic:** [Epic Name]
```

---

**Last Updated:** 2026-01-02  
**Owner:** Scrum Master  
**Review Frequency:** After each epic completion
