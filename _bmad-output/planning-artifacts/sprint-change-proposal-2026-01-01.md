# Sprint Change Proposal
**Project:** diagram_builder - 3D Codebase Visualization Tool
**Date:** 2026-01-01
**Author:** Brian (via Correct Course Workflow)
**Status:** Pending Approval

---

## 1. Issue Summary

### Title
Missing Codebase Import Functionality

### Problem Statement
After completing Phase 5 (UI Package) and testing the application, a critical workflow gap was discovered: there is no UI interface or complete API flow to import/load codebases into workspaces. Users cannot load codebases from local file paths or Git repository URLs, preventing actual use of the application's core parsing and visualization features.

### Discovery Context
- **When Discovered**: Post-Phase 5 application testing
- **Discovery Method**: Manual usage testing revealed missing functionality
- **Not Story-Specific**: Gap in requirements translation from PRD to epics/stories
- **Current State**: All three epics (3, 4, 5) marked as review/done, but missing this critical capability

### Evidence
- **Concrete Issue**: No UI interface exists to load/import codebases
- **User Impact**: Application cannot be used for its core purpose - users have no way to get their code into the system
- **Technical Gap**: Workspace management UI exists (story 5-10), but lacks the codebase import/load functionality that connects it to the parser

### Root Cause
The PRD functional requirements (FR6: "System can process repositories from local file system paths", FR7: "System can process repositories from hosted Git URLs") and user journeys already defined this capability, but it was **not translated into implementation stories** during epic creation.

---

## 2. Impact Analysis

### Epic Impact

#### Epic 3 (Parser Package)
- **Current Status**: review
- **Impact Level**: Minor
- **Required Action**: Verify story 3-4 (repository-integration) supports on-demand loading triggered by API calls
- **Details**: The parser may have been implemented for batch processing only. Need to ensure it can be called dynamically when users import codebases.

#### Epic 4 (API Package)
- **Current Status**: review → **in-progress**
- **Impact Level**: Major
- **Required Action**: Add new story (4-14-codebase-import-api) for codebase import endpoints
- **Details**: Missing REST API endpoints to accept codebase import requests, trigger parser, and manage workspace-codebase associations

#### Epic 5 (UI Package)
- **Current Status**: done → **in-progress**
- **Impact Level**: Major
- **Required Action**: Add new story (5-15-codebase-import-ui) for codebase import user interface
- **Details**: Missing UI components to allow users to input local paths or Git URLs and trigger the import process

### Artifact Conflicts

#### PRD (Product Requirements Document)
- **Conflict**: None
- **Action**: No changes needed
- **Details**: Requirements already exist (FR6, FR7, user journeys mention workspace loading). This is implementation gap, not requirements gap.

#### Architecture Document
- **Conflict**: Minor gaps in documentation
- **Action**: Update required
- **Details**: Need to document:
  - New API endpoints for codebase import
  - Workspace-codebase relationship in Neo4j data model
  - On-demand repository loading workflow clarification

#### UI/UX Specifications
- **Conflict**: No specification exists
- **Action**: Creation required
- **Details**: No UI/UX specification document exists for the project. Need to create UX design for codebase import feature including:
  - Import interface placement and navigation
  - Input method selection (local path vs. Git URL)
  - Form design and validation
  - Workspace association flow
  - Loading states and progress feedback
  - Error handling

#### Other Artifacts
**Requiring Updates:**
- API documentation (new endpoints)
- Database schema/migrations (workspace-codebase relationships)
- Testing strategy (integration tests for import workflow)
- CI/CD pipelines (verify support for new features)
- User documentation (how to import codebases)

---

## 3. Recommended Approach

### Selected Path: Direct Adjustment (Option 1)

**Description:**
Add new stories to existing Epic 4 (API) and Epic 5 (UI) to implement codebase import functionality. Verify Epic 3 story 3-4 supports on-demand loading.

### Complete Justification

**Why This Approach:**

1. **Completes Original Intent**: PRD functional requirements (FR6, FR7) already defined this capability - we're implementing what was always intended, not adding scope

2. **Low Technical Risk**: Straightforward feature addition with no architectural changes required. Uses existing parser, database, and UI infrastructure.

3. **Maintains Team Momentum**: Builds on completed work rather than disrupting it. Team continues forward progress without rollbacks or major pivots.

4. **High Business Value**: Unblocks actual application usage - this is critical for MVP. Without this, the application cannot be demonstrated or used.

5. **Reasonable Effort**: 2 new stories plus verification, estimated 1-2 weeks implementation time. Minimal timeline impact for maximum value.

### Alternatives Considered

**Option 2: Potential Rollback**
- **Evaluation**: Not viable
- **Reasoning**: Rolling back work doesn't help; we need to ADD functionality, not replace it
- **Decision**: Rejected

**Option 3: PRD MVP Review**
- **Evaluation**: Not applicable
- **Reasoning**: MVP scope doesn't need reduction - this completes the scope as originally defined in PRD
- **Decision**: Not necessary

### Trade-offs

**Accept:**
- Short timeline extension (1-2 weeks) to complete missing functionality
- Epic 4 and Epic 5 revert from review/done status to in-progress

**Gain:**
- Fully functional application that meets PRD requirements
- Users can actually use the core features
- Complete end-to-end workflow (import → parse → visualize → export)

**Avoid:**
- Shipping incomplete product that users cannot use
- Needing emergency post-release patches
- User frustration and poor first impressions

---

## 4. Detailed Change Proposals

### Change #1: Epic 4 - New Story 4-14-codebase-import-api

**Story Title:** Codebase Import API Endpoints

**User Story:**
As a user,
I want API endpoints to import codebases into workspaces,
so that I can load local or remote repositories for parsing and visualization.

**Acceptance Criteria:**
1. POST endpoint accepts local file path or Git repository URL
2. Endpoint validates input (path exists, URL is accessible)
3. Endpoint triggers parser to process codebase
4. Endpoint associates codebase with specified workspace
5. Returns codebase metadata (ID, source, import timestamp, status)
6. Handles errors gracefully (invalid paths, clone failures, parsing errors)
7. Supports authentication for private repositories (OAuth tokens, SSH keys)

**Technical Requirements:**
- Endpoint: `POST /api/workspace/:workspaceId/codebases`
- Request body: `{ source: string, type: 'local' | 'git', credentials?: object }`
- Response: `{ codebaseId, workspaceId, source, importedAt, status }`
- Integration with Epic 3 parser (story 3-4 repository-integration)
- Neo4j schema update for workspace-codebase relationships

**Dependencies:**
- Epic 3 story 3-4 must support on-demand loading

**Priority:** HIGH (blocks core usage)

---

### Change #2: Epic 5 - New Story 5-15-codebase-import-ui

**Story Title:** Codebase Import UI Interface

**User Story:**
As a user,
I want a UI interface to import codebases into my workspace,
so that I can load local repositories or Git URLs for visualization.

**Acceptance Criteria:**
1. Import button/interface accessible from workspace management view
2. Modal or form with two input options: local path OR Git repository URL
3. Input validation (path format, URL format, required fields)
4. Display loading state during import process
5. Show progress feedback (parsing status, file count)
6. Display success message with codebase details upon completion
7. Show clear error messages if import fails
8. Imported codebase appears in workspace codebase list
9. Support for private repository authentication (token input)

**Technical Requirements:**
- Integrate with API endpoint `POST /api/workspace/:workspaceId/codebases` (story 4-14)
- Form with radio selection: Local Path | Git URL
- Input fields with validation
- Loading spinner/progress indicator
- Error boundary for graceful error handling
- Update workspace view to show loaded codebases

**Dependencies:**
- Epic 4 story 4-14 (codebase-import-api) must be complete
- UI/UX design for import interface must be created

**Priority:** HIGH (blocks core usage)

---

### Change #3: Epic 3 - Verify Story 3-4-repository-integration

**Story Title:** Repository Integration - Verification

**Current Status:** Review

**Verification Required:**
Does story 3-4 currently support on-demand repository loading triggered by API calls?

**Required Capabilities:**
1. Accept repository source (local path or Git URL) as input parameter
2. Clone/load repository on-demand when called
3. Support authentication for private repositories
4. Return loading status and handle errors
5. Integrate with stories 3-1, 3-2, 3-3 for parsing

**If Capabilities Missing:**
- Update story 3-4 to add on-demand loading capability
- Ensure it can be triggered by API endpoint (story 4-14)
- Add error handling for invalid paths/URLs
- Add support for repository credentials

**If Capabilities Already Implemented:**
- Mark as verified - no changes needed
- Proceed with Epic 4 and Epic 5 stories

**Action Required:** Code review and testing of story 3-4 implementation

---

### Change #4: Architecture Document Updates

**File:** `/Users/brianmehrman/projects/diagram_builder/_bmad-output/planning-artifacts/architecture.md`

**Section 1: API Endpoints - ADD:**

```markdown
### Codebase Import Endpoints

POST   /api/workspace/:workspaceId/codebases
  Description: Import a codebase (local or Git) into workspace
  Request: { source: string, type: 'local'|'git', credentials?: object }
  Response: { codebaseId, workspaceId, source, importedAt, status }

GET    /api/workspace/:workspaceId/codebases
  Description: List all codebases in workspace
  Response: [{ codebaseId, source, importedAt, status }]

DELETE /api/workspace/:workspaceId/codebases/:codebaseId
  Description: Remove codebase from workspace
  Response: { success: boolean }
```

**Section 2: Data Models - ADD:**

```markdown
### Workspace-Codebase Relationship

Nodes:
- Workspace (existing)
- Codebase (new)
  - Properties: id, source, type (local|git), importedAt, status

Relationships:
- (Workspace)-[:CONTAINS]->(Codebase)
- (Codebase)-[:PARSED_INTO]->(Repository) [connects to existing parser graph]
```

**Section 3: Repository Integration Workflow - ADD:**

```markdown
### On-Demand Repository Loading

Workflow:
1. User triggers import via UI (story 5-15)
2. UI calls POST /api/workspace/:id/codebases (story 4-14)
3. API validates input and creates Codebase node
4. API triggers parser (story 3-4) with source
5. Parser clones/loads repository on-demand
6. Parser processes and populates Neo4j graph
7. API updates Codebase status and returns metadata
8. UI displays imported codebase in workspace
```

---

### Change #5: UI/UX Specification Creation

**File:** Create new file at `/Users/brianmehrman/projects/diagram_builder/_bmad-output/planning-artifacts/ux-codebase-import.md`

**Contents:** Complete UX specification for codebase import feature including:

- User flow (10 steps from workspace view to imported codebase)
- UI components specifications:
  - Import button placement
  - Import modal/dialog design
  - Import type selection (radio buttons)
  - Input fields (local path, Git URL, credentials)
  - Action buttons (Import, Cancel)
  - Loading state (spinner, progress)
  - Success state (confirmation)
  - Error state (clear messages, retry)
- Workspace codebase list updates (display imported codebases)

**Rationale:** No UI/UX specification exists for project. This provides clear design guidance for story 5-15 implementation.

---

### Change #6: Sprint Status Updates

**File:** `/Users/brianmehrman/projects/diagram_builder/_bmad-output/implementation-artifacts/sprint-status.yaml`

**Update 1: Epic Statuses**

```yaml
epic-3: review          # No change - verify 3-4
epic-4: in-progress     # Changed from "review"
epic-5: in-progress     # Changed from "done"
```

**Update 2: Add New Stories**

```yaml
development_status:
  # Epic 4
  4-14-codebase-import-api: backlog  # NEW - HIGH PRIORITY

  # Epic 5
  5-15-codebase-import-ui: backlog   # NEW - HIGH PRIORITY (depends on 4-14)
```

**Update 3: Epic Mapping**

```yaml
epics:
  epic-4:
    stories:
      # ... existing stories ...
      - 4-14-codebase-import-api

  epic-5:
    stories:
      # ... existing stories ...
      - 5-15-codebase-import-ui
```

---

## 5. Implementation Handoff

### Change Scope Classification

**Category:** Minor to Moderate

**Rationale:**
- **Minor aspects**: Straightforward feature addition, no architectural changes
- **Moderate aspects**: Affects multiple epics, requires UX design, spans API and UI layers

**Recommendation:** Direct implementation by development team with PO/SM coordination for backlog updates

### Handoff Recipients and Responsibilities

#### Primary: Development Team
**Responsibilities:**
1. Review and verify Epic 3 story 3-4 implementation
2. Implement Epic 4 story 4-14 (codebase-import-api)
3. Implement Epic 5 story 5-15 (codebase-import-ui)
4. Write integration tests for import workflow
5. Update API documentation
6. Update architecture document with technical details

**Deliverables:**
- Working codebase import API endpoint
- Working codebase import UI interface
- Integration tests (passing)
- Updated documentation

#### Secondary: Product Owner / Scrum Master
**Responsibilities:**
1. Update sprint-status.yaml with new stories
2. Set story priority to HIGH
3. Update Epic 4 and Epic 5 statuses from review/done to in-progress
4. Track implementation progress
5. Coordinate story sequencing (4-14 before 5-15)

**Deliverables:**
- Updated sprint status file
- Story tracking and progress updates

#### Tertiary: UX Designer (if available)
**Responsibilities:**
1. Create detailed UI/UX specification for codebase import feature
2. Review UI implementation for design compliance
3. Provide feedback on user experience

**Deliverables:**
- UX specification document (ux-codebase-import.md)
- UI design approval

### Success Criteria

**Implementation Complete When:**
1. ✓ Story 3-4 verified as supporting on-demand loading (or updated)
2. ✓ Story 4-14 implemented and tested (API endpoints functional)
3. ✓ Story 5-15 implemented and tested (UI functional)
4. ✓ End-to-end workflow tested:
   - User can import local codebase successfully
   - User can import Git repository successfully
   - Imported codebases appear in workspace
   - Imported codebases can be visualized
5. ✓ Integration tests passing
6. ✓ Documentation updated (API docs, architecture, user docs)
7. ✓ Sprint status updated to reflect completion

**User Acceptance:**
- User can load a codebase (local or Git) into the application
- User can visualize the imported codebase
- Error handling works gracefully for invalid inputs

### Implementation Timeline

**Estimated Duration:** 1-2 weeks

**Sequencing:**
1. **Week 1, Days 1-2**: UX design creation + Epic 3 verification
2. **Week 1, Days 3-5**: Epic 4 story 4-14 implementation (API)
3. **Week 2, Days 1-3**: Epic 5 story 5-15 implementation (UI)
4. **Week 2, Days 4-5**: Integration testing, documentation, bug fixes

**Dependencies:**
- Epic 4 (4-14) must complete before Epic 5 (5-15) can finish
- UX design should complete before Epic 5 implementation begins

---

## 6. Approval and Next Steps

### Approval Status
**Status:** ⏳ Pending User Approval

**Awaiting Approval From:** Brian

### Upon Approval

**Immediate Actions:**
1. Create story files for 4-14 and 5-15
2. Update sprint-status.yaml with new stories and epic statuses
3. Update architecture.md with documented changes
4. Create ux-codebase-import.md specification
5. Begin Epic 3 story 3-4 verification

**Implementation Kickoff:**
1. Assign stories to development team
2. Create UX design for import interface
3. Set up story tracking and daily standup check-ins
4. Schedule mid-implementation checkpoint (after Epic 4 completion)

### Post-Implementation

**After Stories Complete:**
1. Run complete integration test suite
2. Update all documentation
3. Mark stories as done in sprint-status.yaml
4. Mark Epic 4 and Epic 5 as done (once all stories complete)
5. Conduct user acceptance testing
6. Deploy to production/staging for validation

---

## Appendix

### Related Documents
- PRD: `/Users/brianmehrman/projects/diagram_builder/_bmad-output/planning-artifacts/prd.md`
- Architecture: `/Users/brianmehrman/projects/diagram_builder/_bmad-output/planning-artifacts/architecture.md`
- Sprint Status: `/Users/brianmehrman/projects/diagram_builder/_bmad-output/implementation-artifacts/sprint-status.yaml`

### PRD Requirements Referenced
- FR6: System can process repositories from local file system paths
- FR7: System can process repositories from hosted Git URLs
- User Journey 2 (Marcus Johnson): Mentions loading workspaces
- User Journey 3 (Dev Patel): Mentions parsing codebases

### Change Log
- **2026-01-01**: Initial proposal created via Correct Course workflow
- **Status**: Pending approval

---

**End of Sprint Change Proposal**
