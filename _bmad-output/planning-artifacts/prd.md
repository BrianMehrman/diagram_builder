---
stepsCompleted: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11]
inputDocuments: ['/Users/brianmehrman/projects/diagram_builder/_bmad-output/analysis/brainstorming-session-2025-12-28.md']
workflowType: 'prd'
lastStep: 11
workflowComplete: true
completionDate: '2025-12-28'
briefCount: 0
researchCount: 0
brainstormingCount: 1
projectDocsCount: 0
---

# Product Requirements Document - diagram_builder

**Author:** Brian
**Date:** 2025-12-28

## Executive Summary

**diagram_builder** is an automated code intelligence and visualization platform that transforms codebases into explorable 3D environments. By parsing code structure and relationships directly from repositories, it generates interactive visualizations where architectural patterns become spatial and immediately visible - without manual diagram creation or maintenance.

The platform addresses a specific problem that emerges at scale: **understanding architectural relationships across large, complex, or unfamiliar codebases**. While developers navigate familiar code efficiently through IDEs (go-to-definition, search, references), these tools break down when the question is architectural: "How do these services interact?" "What depends on this module?" "Where are the architectural boundaries?" "What's the blast radius of this change?" Traditional approaches fail: reading code is too granular, manually-created diagrams go stale immediately, and existing visualization tools require manual creation or produce static, non-interactive outputs.

**diagram_builder** serves a different need than daily IDE usage - it's the tool you reach for when you need to **understand, communicate, or document** system architecture:

- **Architecture review sessions** - Visually explore system design with stakeholders in real-time
- **Onboarding to unfamiliar codebases** - Discover structure progressively through spatial exploration
- **Impact analysis before major changes** - Visualize dependency ripple effects across services
- **Technical documentation generation** - Export always-current architectural diagrams automatically
- **Code review of architectural changes** - Understand multi-file, multi-service changes spatially
- **Cross-team collaboration** - Share precise architectural context through coordinates and viewpoints
- **Microservices architecture management** - Visualize relationships across distributed systems

### Target Users

**Primary:** Software architects, technical leads, and engineering managers responsible for understanding, communicating, and maintaining system architecture across teams and codebases.

**Secondary:** Developers onboarding to large/complex systems, conducting architectural code reviews, or working across multiple microservices.

**Not for:** Daily code navigation (use your IDE), learning what code does line-by-line (read the code), or simple single-service applications where mental models suffice.

### Core Value Proposition

The platform eliminates a false choice in software architecture: currently you either **read the code** (accurate but doesn't scale) OR **create diagrams manually** (scales but goes stale). **diagram_builder** extracts architectural information directly from code structure, making it both accurate AND scalable.

**Fundamental insight:** Code structure already encodes architectural decisions - dependency directions, module boundaries, coupling patterns, abstraction layers. These relationships are invisible in text but become immediately apparent when rendered spatially. The challenge isn't extracting this information (parsers solve that), it's making it explorable, understandable, and shareable.

### What Makes This Different

**1. Automatic Generation from Code Structure**

Unlike traditional diagramming tools (Draw.io, Lucidchart) or manual architecture documentation, **diagram_builder** reads code repositories directly using language parsers (Tree-sitter). You point it at a repository, it analyzes structure, and generates visualizations automatically. No manual node placement, no stale diagrams, no maintenance burden.

**Competitive context:** Existing code visualization tools (SonarQube, Structure101, NDepend, CodeScene) provide metrics and basic graphs but require manual interpretation. Gaming-inspired 3D tools (CodeCity) exist as research projects but lack production-readiness, export capabilities, or collaboration features. **diagram_builder** combines automatic parsing, interactive 3D exploration, and practical output generation (PlantUML, Mermaid, C4 diagrams) into a cohesive platform.

**2. Spatial Architecture Understanding**

3D visualization isn't novelty - it's **information density**. When you need to understand how authentication flows through 15 microservices, or how data models relate across layers, spatial positioning reveals patterns that lists and tables obscure. Proximity indicates coupling, vertical layering shows abstraction, visual weight represents complexity.

**When 3D helps:** Multi-service dependencies, layered architectures, complex module relationships, blast radius analysis
**When text/2D is better:** Reading implementation details, understanding algorithms, debugging logic

**3. Intelligent Level-of-Detail (LOD) System**

Borrowed from game engines but solving a real engineering problem: **how do you visualize a million-line codebase without overwhelming users?**

The LOD system automatically adjusts detail based on zoom level and context:
- Zoomed out: See system → services → major modules
- Zoomed in: See files → classes → methods → details
- Context-aware: Architecture review profile shows different detail than performance analysis profile

**Why integration matters:** The same LOD system that improves UX also drives performance optimization (don't render invisible detail), documentation generation (export at current abstraction level), and impact analysis (visualize collapsed module dependencies). Single mechanism, multiple emergent benefits.

**4. Collaboration and Communication**

Software architecture is a team sport. **diagram_builder** treats architectural exploration as inherently collaborative:

- **Coordinate system:** Share precise locations (`auth-service:AuthController.login:L234`) like sharing GPS coordinates
- **Viewpoints:** Save and share camera position + filters + annotations - capturing complete architectural context in a URL
- **Multi-user sessions:** Multiple developers explore the same codebase simultaneously with spatial avatars
- **Living documentation:** Platform visualization is always current; exports are timestamped snapshots

**Honest limitation:** Exported diagrams (PlantUML, Mermaid, PDFs) are snapshots - they go stale like any export. The platform itself stays current with the repository, but once you export, it's a point-in-time artifact. The value is **generation automation**, not magic self-updating documents.

**5. Multiple Export Formats for Multiple Audiences**

Different audiences need different outputs:
- **Architects:** C4 diagrams, system context diagrams (PlantUML, Mermaid)
- **Documentation:** Interactive PDFs, annotated architectural drawings
- **Stakeholders:** Simplified high-level views, annotated screenshots
- **3D professionals:** GLTF/OBJ exports with metadata for presentations

Export current view, select regions, or generate comprehensive documentation - all from the same parsed code structure.

### Technical Architecture

**Parsing & Analysis:** Tree-sitter (universal multi-language parser) extracts code structure into language-agnostic intermediate representation, stored in Neo4j graph database for powerful relationship queries.

**Visualization:** Three.js/WebGL renders 3D scenes in browser. Force-directed layout algorithms convert graph relationships into spatial positioning. LOD system manages performance at scale.

**Collaboration:** WebSocket-based real-time sessions for multi-user exploration. ViewPoint system captures and shares architectural context.

**Infrastructure:** Docker-based development environment, browser-based client (no installation), optional self-hosted or cloud deployment.

### Realistic Expectations

**Learning curve exists:** 3D navigation (camera controls, spatial orientation) requires initial training. First-time users need guided onboarding to understand navigation, LOD behavior, and coordinate system. Estimated time-to-productivity: 30-60 minutes of exploration.

**Complements, doesn't replace:** This is NOT a daily code editor replacement. You'll still write code in your IDE, read implementation details in GitHub, and debug in familiar tools. **diagram_builder** is for architectural understanding, documentation, and communication.

**Scope boundaries:** Initial release focuses on JavaScript/TypeScript. Multi-language support (Python, Java, Go) comes post-MVP. Multi-codebase enterprise features (security, access control, versioning across repositories) require significant additional engineering.

## Project Classification

**Technical Type:** web_app (browser-based, WebGL rendering, REST/WebSocket APIs)
**Domain:** developer_tools (software development tooling)
**Complexity:** high (technical complexity), low (domain/regulatory complexity)
**Project Context:** Greenfield - new project

**Honest complexity assessment:** This is technically ambitious - multi-language parsing, graph database optimization, real-time 3D rendering, WebSocket synchronization, multiple export format generation. Domain complexity is low (no regulatory compliance, no specialized industry knowledge), but engineering complexity is HIGH. Estimate: 7-8 months to functional MVP with focused scope (JS/TS only, core features, basic collaboration).

**Technology foundation:** Neo4j provides proven graph query performance. Tree-sitter handles parsing across languages consistently. Three.js is mature and well-documented for complex 3D visualization. WebGL runs in all modern browsers. The stack is solid - the challenge is integration complexity and performance optimization at scale.

## Success Criteria

### User Success

**The "Aha" Moment:** A developer opens an unfamiliar multi-service codebase, immediately grasps how authentication flows across boundaries, identifies the performance bottleneck visually, and shares a viewpoint URL with their team showing exactly what they found - all without manually creating a single diagram.

**Users succeed when they can answer three critical questions:**

1. **"How does this system work?"** (Static Architecture)
   - Understand current architectural structure through spatial exploration
   - Identify dependencies, coupling, and module boundaries visually
   - Grasp multi-service relationships without reading thousands of lines of code

2. **"How did we get here?"** (Temporal Evolution)
   - Watch architecture evolve through git history (dependencies appear, modules split, services grow)
   - Understand why the architecture looks the way it does by seeing its evolution
   - Identify architectural drift or decay patterns over time

3. **"What happens when I run this?"** (Execution Flow)
   - Follow debugger execution step-by-step through the 3D codebase
   - See actual runtime behavior mapped to code structure
   - Understand what the code actually does vs. what the structure suggests

**Communication and Collaboration:**
- Share precise architectural insights with teammates using coordinate-based references
- Onboard to complex codebases in days instead of weeks
- Conduct architecture reviews as interactive exploration sessions, not static presentations

**User success means developers reach for diagram_builder when they need to understand, explain, or document system architecture.**

### Business Success

**Primary Success Indicators:**

1. **CI/CD Integration Adoption**
   - diagram_builder becomes part of automated development pipelines
   - Every PR includes auto-generated architectural diagrams
   - Teams automate diagram generation rather than manual creation
   - **Target:** 60%+ of active teams have CI/CD integration within 6 months of MVP

2. **Daily Active Usage for Communication**
   - Developers use diagram_builder regularly to explain code and architecture to teammates
   - Becomes the standard tool for architectural discussions
   - Replaces manually-created diagrams in architecture documentation
   - **Target:** 80% of manually-created architectural diagrams replaced by exports

3. **User Growth and Retention**
   - Sustained adoption across teams and organizations
   - Users return daily because it solves real architectural understanding problems
   - **MVP Target (7-8 months):** 50+ active teams using diagram_builder regularly
   - **12-month Target:** 200+ active teams with demonstrated retention

**Business success means diagram_builder becomes infrastructure - automated into workflows, used daily, and trusted for architectural communication.**

### Technical Success

**Foundation: Parsing Accuracy**
- Parser correctly identifies all imports, dependencies, class relationships, and method calls
- Visualization accurately reflects actual code structure
- Developers trust the tool because it represents their codebase correctly
- **Target:** 95%+ accuracy on dependency detection and relationship mapping

**Critical Capability: Multi-Codebase Integration**
- Load multiple applications/services simultaneously
- Accurately map cross-service connections (API calls, shared dependencies, service boundaries)
- Visualize microservices architecture as unified system
- **Target:** Correctly visualize relationships across 5+ loaded codebases

**Performance Benchmarks (from Phase Success Criteria):**

*Phase 1 - Parsing Engine:*
- Parse time: <2 seconds per 100 files
- Query response: <1 second for common patterns
- Setup time: <5 minutes from clone to running
- Memory usage: <500MB for 5000 file project

*Phase 2 - Visualization:*
- Frame rate: 60fps minimum with 1000+ visible nodes
- LOD transitions: Smooth, no visible stuttering
- Initial render: <3 seconds for medium project
- Navigation response: <16ms input to render

*Phase 3 - Navigation:*
- Search latency: <500ms for any query
- Mini-map render: <100ms update time
- Navigation jump: <200ms to target location

*Phase 4 - Collaboration:*
- Multi-user support: 10+ concurrent users per session
- Position update latency: <100ms
- Viewpoint save/load: <500ms
- Export generation: <5 seconds for large diagrams

**Reliability and Quality:**
- Test coverage: >80% across all modules
- All tests passing in CI/CD
- One-command setup fully automated
- Schema migrations run idempotently

**Technical success means the foundation is solid enough to scale beyond MVP - accurate parsing, performant rendering, and reliable multi-codebase integration.**

### Measurable Outcomes

**3 Months (Phase 1-2 Complete):**
- ✅ Parse and visualize medium-sized JS/TS projects (1000+ files) accurately
- ✅ 60fps rendering with automatic LOD working smoothly
- ✅ Early adopter teams testing and providing feedback
- ✅ Parsing accuracy validated at 95%+ on test codebases

**7-8 Months (MVP Launch):**
- ✅ 50+ active teams using diagram_builder regularly
- ✅ Multi-codebase integration working across microservices
- ✅ CI/CD integration available and documented
- ✅ Export to PlantUML, Mermaid, and 3D formats functional
- ✅ Multi-user collaboration sessions working reliably
- ✅ Time-to-architectural-understanding: 50% reduction measured

**12 Months (Post-MVP Growth):**
- ✅ 200+ active teams with sustained retention
- ✅ 60%+ of teams using CI/CD integration
- ✅ 80% replacement of manually-created architectural diagrams
- ✅ Git history temporal visualization working
- ✅ Debugger execution flow integration (if prioritized)
- ✅ Community growth (if open source): active contributors, growing adoption

**Success is measurable through adoption (teams using it), integration (CI/CD automation), and impact (replacing manual diagram creation).**

## Product Scope

### MVP - Minimum Viable Product (7-8 Months)

**What Must Work for This to Be Useful:**

**Phase 1 - Foundation (Weeks 1-8):**
- Parse JavaScript/TypeScript codebases using Tree-sitter
- Extract structure into Neo4j graph database
- Calculate basic metrics (complexity, coupling, dependencies)
- Automated development environment setup
- Query performance: <1 second for common patterns

**Phase 2 - Visualization (Weeks 9-16):**
- 3D rendering with Three.js/WebGL in browser
- Automatic LOD (Level of Detail) system
- Force-directed layout algorithm
- Navigate from architecture view → method level smoothly
- Performance: 60fps with 1000+ nodes
- Hidden-by-default philosophy (show only critical entry points initially)

**Phase 3 - Navigation (Weeks 17-22):**
- Coordinate system: `file:class:method:line` format
- Integrated search across codebase graph
- Dual mini-map (2D file tree + 3D spatial view)
- HUD with breadcrumbs and context
- Spatial filtering via mini-map interaction

**Phase 4 - Collaboration (Weeks 23-30):**
- Viewpoint system (save/share camera + filters + annotations)
- Export to PlantUML, Mermaid, Draw.io formats
- Export to 3D formats (GLTF with metadata)
- Multi-user sessions with spatial avatars
- Coordinate-based communication

**MVP Scope Boundaries:**
- ✅ JavaScript/TypeScript only (prove concept without multi-language complexity)
- ✅ Static analysis only (git history and debugger integration deferred to Growth)
- ✅ Single codebase primary, multi-codebase secondary (both work, but optimization focuses on single)
- ✅ Web-first (browser-based, no native desktop app)
- ✅ Basic collaboration (read-only exploration, not simultaneous editing)

**MVP Success = All 4 phases complete, users can understand architecture, export diagrams, and collaborate in real-time.**

### Growth Features (Post-MVP)

**What Makes It Competitive:**

**Temporal Visualization - Git History:**
- Scrub through repository history to watch codebase evolution
- See dependencies appear, classes split, modules grow over time
- Identify architectural drift and decay patterns
- Collapsed LOD elements show aggregate change visualization
- **Business Value:** Understand why architecture evolved to current state

**Execution Flow Visualization - Debugger Integration:**
- Connect to running debugger sessions
- Follow execution step-by-step through 3D codebase
- Map runtime behavior to code structure
- Visualize actual code paths vs. potential paths
- **Business Value:** Understand what code actually does at runtime

**Multi-Language Support:**
- Python parser and visualization
- Java parser and visualization
- Go, Ruby, and other languages
- Unified multi-language codebase visualization
- **Business Value:** Enterprise adoption requires multi-language support

**Advanced Analysis Features:**
- Test coverage mapping to 3D visualization
- Security auditing (vulnerability detection, data flow tracing)
- Performance profiling (static anti-pattern detection)
- Documentation generation from LOD views
- Code quality gates (pre-commit enforcement)
- **Business Value:** Becomes comprehensive code intelligence platform

**Enterprise Features:**
- Self-hosted deployment options
- Access control and permissions
- Multi-repository workspace management
- Version control across visualizations
- Team analytics and usage tracking
- **Business Value:** Large organization adoption

**Growth Phase = Expand from MVP foundation to comprehensive code intelligence and visualization platform**

### Vision (Future)

**The Dream Version:**

**Living Architecture Platform:**
- Real-time streaming parsing (watch mode for live updates during development)
- AI/LLM semantic labeling (intelligent pattern recognition)
- Runtime telemetry integration (live performance data overlaid on structure)
- Automated migration assistant (refactoring suggestions based on visualization)
- Tri-dimensional analysis unified: static code + runtime behavior + git history

**Advanced Collaboration:**
- Code review as spatial exploration (PR changes visualized in 3D)
- Architecture decision records (ADRs) linked to spatial locations
- Team knowledge capture (annotations, insights, tribal knowledge preserved)
- Presentation mode (record and playback navigation sequences for walkthroughs)

**Ecosystem Integration:**
- IDE plugins (VS Code, JetBrains) with bidirectional navigation
- Project management integration (Jira, Linear) linking issues to code locations
- Monitoring integration (Datadog, New Relic) linking alerts to architecture
- Documentation platforms (Notion, Confluence) embedding interactive diagrams

**Multi-Purpose Intelligence:**
- Dependency auditor (license compliance across all dependencies)
- Code clone detection (duplicate code visualization)
- Multi-codebase mega-graph (enterprise-wide architectural analysis)
- Predictive navigation (ML-based suggestions for exploration)
- Impact analysis with confidence scoring (probabilistic change analysis)

**Vision = diagram_builder becomes the primary interface for understanding, navigating, and evolving software architecture - bridging code, runtime, history, and human knowledge.**

## User Journeys

### Journey 1: Sarah Chen - The Microservices Detective

Sarah is a senior software architect at a fintech company who just inherited responsibility for a payment processing system spanning 23 microservices. The original architects left six months ago, the documentation is outdated, and she has three weeks to assess whether the system can handle Black Friday traffic - 10x normal load.

She's drowning in code. She's spent four days reading service definitions, tracing API calls through log files, and sketching dependency diagrams on her whiteboard. She knows there's a bottleneck somewhere in the authentication flow, but manually tracing requests across 15 services is like solving a maze blindfolded. Her manager just asked for the architecture review presentation - due Friday.

A colleague mentions diagram_builder. Sarah points it at their mono-repo, and within minutes, she's flying through a 3D visualization of all 23 services. She zooms out and immediately sees the problem: authentication service sits between payment gateway and fraud detection like a traffic cop at rush hour. Every transaction hits it twice. She shares a viewpoint URL with her team in Slack: `auth-service:TokenValidator.verify:L145` - "This is our bottleneck."

Three hours later, she's presenting to leadership with exported PlantUML diagrams showing current architecture, the proposed fix (move token validation to an edge service), and the impact analysis (only 3 services affected). The presentation that would have taken her two weeks took three hours. Black Friday preparation is back on track.

**This journey reveals requirements for:**
- Multi-codebase parsing and visualization (23 microservices)
- Fast initial rendering and navigation
- Bottleneck/hotspot visualization
- Viewpoint sharing with coordinate system
- Export to PlantUML for presentations
- Impact analysis showing affected services

### Journey 2: Marcus Johnson - From Lost to Leading in 3 Days

Marcus is a senior developer who just joined a healthcare tech startup. It's his first week, and he's been assigned to add HIPAA audit logging to their patient records system. The problem? The codebase is 200,000 lines across 8 services, there's no up-to-date architecture documentation, and the team expects him to be productive by next Monday.

His onboarding buddy gave him access to the repos and said "just explore, you'll figure it out." Marcus has been clicking through files in VS Code for two days and still doesn't understand how patient data flows from the mobile app through their backend to the database. He's scheduled a 2-hour deep dive with the tech lead tomorrow, but he hates going into meetings unprepared.

That evening, Marcus discovers diagram_builder already running on their internal tools portal. He loads the patient-records workspace and starts exploring. Within 20 minutes, he finds the patient data flow: `MobileAPI -> AuthMiddleware -> PatientController -> EncryptionService -> Database`. He follows the 3D path, taking notes. He searches for "audit" and finds three existing audit implementations in different services - clearly no standard pattern yet.

The next day's meeting is completely different. Marcus arrives with questions, not confusion: "I see we have three different audit approaches - should we standardize on AuditService or create a new pattern?" The tech lead is impressed. By Friday, Marcus has a design proposal showing exactly where audit logging should be added (with exported Mermaid diagrams), and he's already productive.

**This journey reveals requirements for:**
- Quick workspace loading (saved multi-codebase configurations)
- Search functionality across codebase
- Path tracing and navigation
- Pattern identification (finding similar code)
- Export to Mermaid for design proposals
- Onboarding-optimized UI (breadcrumbs, HUD with context)

### Journey 3: Dev Patel - The Automation Architect

Dev is a DevOps engineer at an e-commerce company with 40 development teams. Every week, engineering leadership asks the same question: "Can someone show me the current architecture?" And every week, it's the same scramble - someone manually creates a diagram, it's out of date by the time the meeting happens, and it only covers one team's services.

Dev has automated everything else (CI/CD, deployments, monitoring), but architectural documentation is still manual. He's tried auto-generating diagrams from code before, but the tools either produced unusable spaghetti diagrams or required so much manual configuration that teams abandoned them.

He evaluates diagram_builder and realizes it can solve this. He spends a Friday afternoon writing a GitHub Actions workflow: on every merge to main, parse the codebase, generate PlantUML architecture diagrams, and commit them to the docs/ folder. He configures it to export at three different LOD levels: system overview, service details, and per-service class diagrams.

Monday morning, a team merges a PR that adds a new recommendation service. Within 5 minutes, the architecture diagrams in their documentation site update automatically. The first comment on the PR: "Wow, the docs updated themselves - nice!" Three weeks later, 15 teams have adopted the same CI/CD integration. Leadership's weekly architecture question now gets answered with "check the docs portal - always current."

**This journey reveals requirements for:**
- CLI/API for headless operation
- Batch export to multiple formats (PlantUML, Mermaid)
- LOD-level selection for exports (system vs. detail level)
- Fast parse/export performance (CI/CD must be quick)
- Documentation on CI/CD integration patterns
- Configuration file for repeatable parsing settings

### Journey 4: Priya Sharma - The Documentation Lifeline

Priya is a technical writer at a SaaS company that just secured a major enterprise client. The contract requires comprehensive technical documentation including current architecture diagrams, data flow diagrams, and security boundary documentation - all due in 6 weeks for their security audit.

She's worked with the engineering teams before. Getting architectural diagrams is like pulling teeth. She requests them, engineers promise to create them "this week," and three weeks later she's still waiting. When she finally gets diagrams, they're inconsistent (different tools, different styles) and often outdated (based on last quarter's architecture, not current).

Her engineering manager suggests she try diagram_builder herself. Priya isn't a developer, but she's technical enough to follow instructions. She loads the production codebase, sets the LOD profile to "Architecture," and immediately sees the system laid out: API Gateway → Auth Service → Business Logic Services → Database Layer. She exports to PlantUML and gets a clean C4-style architecture diagram.

For data flows, she switches to the "Security Audit" LOD profile (configured by the security team), which highlights authentication boundaries, encryption points, and data storage. She exports multi-view sheets showing the same architecture from different perspectives. In two weeks, she has a complete documentation package: 15 architectural diagrams, all current, all consistent in style. The enterprise client's auditor comments: "This is the most comprehensive and current technical documentation we've seen."

**This journey reveals requirements for:**
- Non-developer-friendly UI (clear, guided)
- Pre-configured LOD profiles (Architecture, Security Audit, etc.)
- Export to documentation-standard formats (C4, PlantUML)
- Multi-view sheet export (same architecture, different perspectives)
- Consistent styling across exports
- Ability to annotate and add context to exported diagrams

### Journey 5: James Rivera - The Code Review Revolution

James is an engineering manager leading a team of 12 developers working on a real-time analytics platform. Code reviews have become a bottleneck. When someone makes a change that touches multiple services, it takes hours for reviewers to understand the impact. Pull requests sit in review for days because no one wants to approve something they don't fully understand.

Last week, a "simple refactoring" PR broke the data ingestion pipeline because the reviewer didn't realize a seemingly internal method was called by three other services. James mandated more thorough reviews, but that just made things slower. The team is frustrated, velocity is down, and he needs a better solution.

He configures diagram_builder to run on every PR. Now when a developer opens a pull request that changes `DataProcessor.transform()`, the CI job posts a comment with a viewpoint link showing that method in 3D context with all its callers highlighted. Reviewers click the link and immediately see: "Oh, this method is called by IngestionService, TransformService, AND ExportService - not just local."

Reviews get faster and more thorough simultaneously. Developers start using viewpoint links in PR descriptions: "Here's what I'm changing: [viewpoint]. Here's the impact: [second viewpoint showing affected services]." A PR that would have taken 3 days of back-and-forth now gets approved in 4 hours with confidence. Team velocity recovers, and architectural awareness across the team actually improves.

**This journey reveals requirements for:**
- Git integration (run on PRs)
- Highlight/filter specific code elements (changed methods)
- Impact visualization (show all callers/dependencies)
- Viewpoint generation from CI (automated)
- Viewpoint annotations in URLs
- Shareable links that preserve complete context

### Journey Requirements Summary

These five journeys reveal the following capability requirements for diagram_builder:

**Core Parsing & Visualization:**
- Multi-codebase/multi-service parsing (microservices architecture support)
- Fast initial rendering and progressive loading
- Multiple LOD profiles (Architecture, Security Audit, Code Review, Performance)
- Search across entire codebase graph
- Pattern identification and similar code detection
- Hotspot/bottleneck visualization

**Navigation & Exploration:**
- 3D spatial navigation with camera controls
- Coordinate system for precise locations (`service:class:method:line`)
- Breadcrumbs and HUD showing current context
- Path tracing through dependencies
- Impact analysis showing affected code
- Highlight/filter specific elements

**Collaboration & Sharing:**
- Viewpoint system (save camera + filters + annotations)
- Shareable viewpoint URLs with complete context
- Workspace configurations (multi-codebase setups)
- Team-configured LOD profiles
- Annotation capabilities

**Export & Documentation:**
- PlantUML export (architecture diagrams)
- Mermaid export (markdown-friendly)
- C4 diagram generation
- Multi-view sheet export (multiple perspectives)
- LOD-level selection for exports (system vs. detail)
- Consistent styling across exports

**CI/CD & Automation:**
- CLI/API for headless operation
- GitHub Actions / GitLab CI integration
- Automated viewpoint generation
- PR comment integration
- Batch export capabilities
- Fast parse/export performance for CI pipelines

**User Experience:**
- Non-developer-friendly interface (for technical writers)
- Guided onboarding for first-time users
- Pre-configured profiles for different use cases
- Saved workspace quick-loading
- Performance for large codebases (200k+ lines)

## Innovation & Novel Patterns

### Detected Innovation Areas

diagram_builder introduces several genuine innovations that challenge existing approaches to code understanding:

**1. Spatial Code Navigation Paradigm**

Traditional code navigation is text-based: search, go-to-definition, file trees, grep. diagram_builder introduces **spatial navigation** - treating the codebase as an explorable 3D environment where architectural relationships become physically visible through positioning, proximity, and layering.

**Innovation:** Borrowing game engine navigation patterns (camera controls, LOD, mini-maps) and applying them to software architecture exploration. Code isn't just text to read, it's space to navigate.

**Why it's novel:** Existing visualization tools produce static 2D diagrams. diagram_builder makes code structure explorable and interactive in three dimensions, where information density and spatial relationships reveal architectural patterns that flat representations obscure.

**2. LOD as Multi-Purpose System**

The Level-of-Detail (LOD) system serves multiple purposes simultaneously:
- **UX**: Prevents cognitive overload by showing only relevant detail at current zoom level
- **Performance**: Optimizes rendering by not drawing invisible geometry
- **Documentation**: Exports diagrams at current abstraction level
- **Impact Analysis**: Shows collapsed module dependencies for change assessment

**Innovation:** Single mechanism with emergent benefits across UX, performance, documentation, and analysis. Not just a rendering optimization, but a fundamental way of interacting with code at different abstraction levels.

**Why it's novel:** Most tools either show everything (overwhelming) or require manual filtering (tedious). Automatic, context-aware LOD that adapts to user exploration is unprecedented in code visualization.

**3. Tri-Dimensional Code Analysis** *(Highest Risk Innovation)*

Integration of three different perspectives into unified visualization:
- **Static Analysis**: Code structure as written (files, classes, dependencies)
- **Temporal Analysis**: How code evolved over time via git history
- **Runtime Analysis**: Actual execution behavior from debugger integration

**Innovation:** Answering "How does this work?" (static), "How did we get here?" (temporal), and "What happens when I run this?" (runtime) in a single explorable environment.

**Why it's novel:** Existing tools handle these separately - IDEs for static, git tools for history, debuggers for runtime. Unifying all three in spatial visualization hasn't been done before.

**4. Coordinate System for Spatial Collaboration**

Introduction of code location addressing: `service:class:method:line` format as spatial coordinates, enabling:
- Precise location sharing ("meet me at auth-service:TokenValidator.verify:L145")
- Viewpoints that capture camera position + filters + annotations
- Shareable architectural insights as URLs

**Innovation:** Treating code locations like GPS coordinates - shareable, precise, and context-preserving. Moving beyond static file paths to spatial addresses.

**Why it's novel:** Code references are typically file paths and line numbers. Spatial coordinates add camera perspective, zoom level, and architectural context, making "come look at this" actually work across teams.

### Market Context & Competitive Landscape

**Existing Code Visualization Tools:**
- **SonarQube, CodeScene, Structure101**: Provide metrics and basic 2D graphs, but require manual interpretation
- **CodeCity (Research)**: 3D visualization proof-of-concept, but lacks production-readiness, export capabilities, or collaboration features
- **Traditional Diagramming**: Draw.io, Lucidchart - manual creation, no automation, diagrams go stale immediately

**diagram_builder Differentiation:**
- **Automatic generation** from code structure (no manual maintenance)
- **Interactive 3D exploration** (not static diagrams)
- **Practical output generation** (PlantUML, Mermaid, C4 for actual documentation)
- **Collaboration-first** (viewpoints, coordinates, multi-user sessions)
- **Temporal and runtime integration** (beyond static analysis)

**Gap Being Filled:** The false choice between "read the code" (accurate but doesn't scale) and "create diagrams manually" (scales but goes stale). diagram_builder makes architectural understanding both accurate AND scalable through automatic parsing and spatial visualization.

### Validation Approach

**Risk #1: Tri-Dimensional Integration (Static + Temporal + Runtime)** - *Highest Risk*

**Technical Feasibility Risks:**
- Conflicting data between static analysis and runtime behavior
- Performance degradation when combining three data sources
- Integration complexity across independent systems
- Cognitive overload from too much simultaneous information

**Validation Strategy:**
- **Phased Implementation**: Build static visualization first (MVP Phase 1-2), validate it works, then add temporal (Growth), then runtime (Growth) - not all at once
- **Independent Operation**: Each dimension must work standalone - users can view static only, or static + temporal, with runtime as optional overlay
- **User Testing**: Test each integration point separately (static alone, then + temporal, then + runtime) to identify which combinations provide value vs. confusion
- **Fallback**: If tri-dimensional proves too complex, deliver as three separate modes users can switch between rather than simultaneous overlay

**Success Metrics:**
- Users can successfully answer all three questions ("How does this work?", "How did we get here?", "What happens when I run this?")
- Performance remains acceptable (60fps) with all three dimensions active
- Users report value from integration, not just individual dimensions

**Risk #2: LOD System Validation** - *Second Highest Risk*

**User Experience Risks:**
- Automatic LOD disorients users (detail appearing/disappearing unexpectedly)
- "Hidden by default" hides the wrong architectural elements
- Smooth transitions feel jarring rather than helpful
- Different user types need different LOD strategies

**Validation Strategy:**
- **Early Prototyping**: Build LOD system in Phase 2 (weeks 9-16) and test with early adopters immediately
- **User Studies**: Measure time-to-architectural-understanding with and without LOD to validate it actually helps
- **Configurable Profiles**: Create task-specific LOD profiles (Architecture Review, Code Review, Performance Analysis) and validate each separately
- **Manual Override**: Provide manual LOD controls as fallback if automatic behavior proves disorienting
- **Metrics-Driven**: Track user navigation patterns - if users constantly fight the LOD (manual overrides, confusion), adjust or simplify

**Success Metrics:**
- Time to find architectural bottlenecks: 50%+ faster with LOD vs. without
- User satisfaction ratings for "helpful" vs. "confusing"
- Minimal manual LOD override usage (indicates automatic behavior works)
- 60fps performance maintained across all LOD levels

**Fallback**: If automatic LOD proves too complex, fall back to simpler discrete zoom levels (System → Service → File → Class → Method) without smooth transitions or context-aware behavior.

### Risk Mitigation

**Technical Risks:**
- **Neo4j performance at scale**: Mitigate with aggressive indexing, query optimization, caching. Fallback: hybrid approach (hot data in-memory, cold in database)
- **Three.js rendering performance**: Mitigate with instanced rendering, frustum culling, LOD-based geometry reduction. Fallback: limit visible nodes, implement spatial partitioning
- **Multi-codebase integration complexity**: Mitigate with standardized parsing output format. Fallback: optimize for single codebase first, multi-repo as secondary feature

**Innovation Risks:**
- **3D navigation learning curve**: Mitigate with guided onboarding, clear tutorials, 2D mini-map as orientation fallback
- **Spatial metaphor doesn't resonate**: Mitigate with early user testing (Phase 2). Fallback: offer 2D layout options alongside 3D
- **Coordinate system adoption**: Mitigate with Slack/GitHub integration making coordinates clickable. Fallback: support traditional file:line references alongside coordinates

**Market Risks:**
- **"Too novel" - users prefer familiar 2D diagrams**: Mitigate with familiar export formats (PlantUML, Mermaid) as bridge. Users can explore in 3D, export to 2D for comfort
- **Developer tool fatigue**: Mitigate with CI/CD integration - make diagram_builder infrastructure, not another tool to learn
- **Complexity perceived as unnecessary**: Mitigate with immediate value demonstration - solve real architectural pain (understanding microservices) in first 20 minutes

**Validation Gates Before Scaling:**
- **Phase 2 Completion**: Validate LOD system works and users find 3D navigation valuable before building Phase 3-4
- **MVP Launch**: Validate static visualization adoption before investing in temporal/runtime integration
- **Post-MVP**: Only add tri-dimensional integration if users explicitly request historical and runtime perspectives

## Developer Tool Specific Requirements

### Project-Type Overview

diagram_builder is a developer tool that functions as both a **service** (web-based visualization platform) and a **CLI** (command-line parsing and export utility). It follows modern cloud-native deployment patterns while providing flexible installation options for different use cases: local development, CI/CD automation, and production deployment.

**Deployment Model:**
- **Development**: Docker Compose for local setup with Neo4j + application services
- **Production**: Kubernetes deployment via Helm charts
- **CI/CD**: Docker images + CLI for headless operation in pipelines

**Access Model:**
- **Web UI**: Browser-based interface, CDN-hosted (production) or web server-hosted (MVP)
- **CLI**: Node.js-based command-line tool for parsing, export, and automation
- **API**: REST/WebSocket APIs for programmatic access and integration

### Technical Architecture Considerations

**Language Support Matrix:**

*Parsing Capabilities (Code Languages):*
- **MVP (Phase 1)**: JavaScript, TypeScript via Tree-sitter
- **Post-MVP Growth**: Python, Java, Go, Ruby (additional Tree-sitter grammars)
- **Vision**: Multi-language mega-graph (enterprise-wide analysis across languages)

*Implementation Languages:*
- **Backend/Parsing Engine**: TypeScript/Node.js
- **Web UI**: React or Vue (framework choice), TypeScript
- **CLI**: Node.js (TypeScript compiled to JavaScript)
- **Database**: Neo4j (Cypher query language)
- **3D Rendering**: Three.js (JavaScript/WebGL)

**Platform Support:**
- **Server**: Linux (Docker containers, Kubernetes nodes)
- **Client**: Modern browsers (Chrome, Firefox, Safari, Edge - WebGL support required)
- **Development**: macOS, Linux, Windows (via Docker)

### Installation Methods

**For Developers (Local Development):**

```bash
# Clone repository
git clone https://github.com/your-org/diagram-builder.git
cd diagram-builder

# One-command setup (Docker Compose + Neo4j + dependencies)
npm run setup

# Start development environment
npm run dev
```

**Installation Requirements:**
- Docker & Docker Compose installed
- Node.js 18+ (for CLI and development)
- 8GB RAM minimum (Neo4j + application services)
- Modern browser with WebGL support

**For DevOps/CI (Docker Container):**

```bash
# Pull Docker image
docker pull diagram-builder/parser:latest

# Run headless parsing and export
docker run -v /path/to/codebase:/code \
  diagram-builder/parser:latest \
  parse /code --export plantuml --output /code/docs/architecture.puml
```

**For Production Deployment (Kubernetes + Helm):**

```bash
# Add Helm repository
helm repo add diagram-builder https://charts.diagram-builder.io

# Install with custom values
helm install diagram-builder diagram-builder/diagram-builder \
  --set neo4j.password=yourpassword \
  --set ui.cdn.enabled=true \
  --set ui.cdn.url=https://cdn.yourdomain.com
```

**Helm Chart Configuration:**
- Neo4j cluster configuration (standalone or clustered)
- Parsing service replicas and resource limits
- Web UI deployment (CDN or web server)
- Ingress configuration for external access
- Persistent volume claims for Neo4j data

**For CLI Usage (Global Install):**

```bash
# Install globally via npm
npm install -g diagram-builder-cli

# Verify installation
diagram-builder --version

# CLI help
diagram-builder --help
```

### Repository Access & Processing

**Supported Input Sources:**

**Local File System:**
```bash
# Parse local codebase
diagram-builder parse /path/to/project

# Parse and export
diagram-builder parse /path/to/project --export mermaid --output ./docs/
```

**Hosted Repositories (GitHub, GitLab, Bitbucket):**
```bash
# Parse remote repository (clones automatically)
diagram-builder parse https://github.com/org/repo.git

# Parse specific branch
diagram-builder parse https://github.com/org/repo.git --branch main

# Parse with authentication (private repos)
diagram-builder parse https://github.com/org/repo.git --token $GITHUB_TOKEN
```

**Processing Workflow:**
1. **Clone** (if remote repository): Shallow clone to temporary directory
2. **Parse**: Tree-sitter processes files, extracts structure to intermediate representation
3. **Populate**: Graph database (Neo4j) populated with nodes and relationships
4. **Analyze**: Metrics calculated (complexity, coupling, dependencies)
5. **Visualize/Export**: 3D visualization generated or diagrams exported
6. **Cleanup** (if cloned): Remove temporary clone directory

**Repository Requirements:**
- Git repository (local or hosted)
- Read access (public repos) or authentication token (private repos)
- Supported languages present (JS/TS for MVP)

### API Surface

**REST API Endpoints (Programmatic Access):**

```
POST   /api/parse              # Trigger parsing of codebase
GET    /api/parse/:id/status   # Check parsing status
GET    /api/graph/:id          # Retrieve graph data
POST   /api/export             # Generate diagram exports
GET    /api/viewpoints/:id     # Load saved viewpoint
POST   /api/viewpoints         # Save new viewpoint
GET    /api/workspaces         # List saved workspaces
POST   /api/workspaces         # Create workspace configuration
```

**WebSocket API (Real-Time Collaboration):**

```
ws://host/collaboration/:sessionId

Events:
- user:join              # User joins collaborative session
- user:position          # User camera position update
- user:leave             # User leaves session
- viewpoint:share        # Share viewpoint with session
- annotation:add         # Add annotation to view
```

**CLI Commands:**

```bash
# Parsing
diagram-builder parse <path|url> [options]
  --branch <name>        # Git branch to parse
  --token <token>        # Authentication token
  --output <dir>         # Output directory
  --config <file>        # Configuration file

# Export
diagram-builder export <workspace> [options]
  --format <type>        # plantuml|mermaid|gltf|png|svg
  --lod <level>          # system|service|file|class|method
  --output <file>        # Output file path

# Workspace Management
diagram-builder workspace list
diagram-builder workspace create <name> --repos <urls>
diagram-builder workspace load <name>

# Server (Local Development)
diagram-builder serve [options]
  --port <number>        # Server port (default: 3000)
  --neo4j <url>         # Neo4j connection string

# Help
diagram-builder --help              # General help
diagram-builder <command> --help    # Command-specific help
```

### CI/CD Integration

**GitHub Actions Template:**

```yaml
name: Generate Architecture Diagrams

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  diagrams:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Parse Codebase
        uses: diagram-builder/action@v1
        with:
          path: .
          export-formats: plantuml,mermaid
          output-dir: docs/architecture
          lod-levels: system,service,file

      - name: Commit Updated Diagrams
        run: |
          git config user.name "diagram-builder[bot]"
          git config user.email "bot@diagram-builder.io"
          git add docs/architecture/
          git commit -m "Update architecture diagrams" || true
          git push
```

**Local CI/CD Execution:**

```bash
# Run the same pipeline locally using Docker
docker run -v $(pwd):/workspace \
  diagram-builder/ci:latest \
  --path /workspace \
  --export plantuml,mermaid \
  --output /workspace/docs/architecture

# Or using npm script
npm run ci:diagrams
```

**CI/CD Scripts Provided:**

- `scripts/ci-parse.sh` - Parsing script for CI environments
- `scripts/ci-export.sh` - Export generation for CI
- `scripts/ci-validate.sh` - Validation checks (parsing succeeded, exports generated)
- `scripts/local-ci.sh` - Run CI/CD pipeline locally for testing

**GitLab CI Template:**

```yaml
architecture-diagrams:
  image: diagram-builder/ci:latest
  script:
    - diagram-builder parse . --export plantuml --output docs/
  artifacts:
    paths:
      - docs/architecture/
  only:
    - main
```

**CI/CD Performance Targets:**
- Parse time: <2 minutes for 5000 file project
- Export generation: <30 seconds for all formats
- Total CI job time: <3 minutes (to avoid bottlenecking PRs)

### Code Examples & Usage Patterns

**Example 1: Parse Local Codebase**

```javascript
// Using API directly
const DiagramBuilder = require('diagram-builder');

const parser = new DiagramBuilder.Parser({
  neo4jUrl: 'bolt://localhost:7687',
  neo4jUser: 'neo4j',
  neo4jPassword: 'password'
});

await parser.parse('/path/to/project', {
  languages: ['javascript', 'typescript'],
  progressCallback: (progress) => {
    console.log(`Parsing: ${progress.filesProcessed}/${progress.totalFiles}`);
  }
});

console.log('Parsing complete!');
```

**Example 2: Generate Exports Programmatically**

```javascript
const exporter = new DiagramBuilder.Exporter({
  workspaceId: 'my-workspace'
});

// Export PlantUML at system level
await exporter.export({
  format: 'plantuml',
  lod: 'system',
  output: './docs/system-architecture.puml'
});

// Export Mermaid at service level
await exporter.export({
  format: 'mermaid',
  lod: 'service',
  output: './docs/service-dependencies.mmd'
});
```

**Example 3: Load and Share Viewpoint**

```javascript
const viewpoints = new DiagramBuilder.Viewpoints({
  apiUrl: 'https://diagram-builder.yourcompany.com'
});

// Load viewpoint from URL
const viewpoint = await viewpoints.load('vp_abc123');

// Apply viewpoint (camera position, filters, annotations)
await viewer.applyViewpoint(viewpoint);

// Create and share new viewpoint
const newViewpoint = await viewer.captureViewpoint({
  name: 'Authentication Bottleneck',
  description: 'Shows the auth service load issue'
});

const shareUrl = await viewpoints.save(newViewpoint);
console.log(`Share this: ${shareUrl}`);
```

**Example 4: CI/CD Integration (npm script)**

```json
{
  "scripts": {
    "docs:architecture": "diagram-builder parse . --export plantuml,mermaid --output docs/architecture",
    "docs:validate": "diagram-builder validate docs/architecture"
  }
}
```

### Documentation Strategy

**Auto-Generated Documentation:**

1. **API Reference**
   - Generated from TypeScript type definitions and JSDoc comments
   - Tool: TypeDoc or similar
   - Output: `docs/api-reference/` (hosted alongside project docs)
   - Auto-updated on every release

2. **Architecture Diagrams**
   - Generated from diagram_builder parsing itself (dogfooding)
   - Formats: PlantUML system overview, Mermaid service dependencies
   - Output: `docs/architecture/` in repository
   - Auto-updated via CI/CD on main branch merges

3. **CLI Command Reference**
   - Generated from CLI command definitions
   - Format: Markdown tables with command, flags, descriptions
   - Accessed via `diagram-builder --help` or online docs

**Manual Documentation:**

1. **Getting Started Guide**
   - Installation (local dev, Docker, Helm)
   - First parse (tutorial with sample repository)
   - Basic navigation (3D controls, mini-map, search)
   - First export (generating PlantUML diagram)
   - Estimated completion time: 20 minutes

2. **Feature Tutorials**
   - LOD system usage and profiles
   - Viewpoint creation and sharing
   - Multi-codebase workspace setup
   - CI/CD integration step-by-step
   - Collaboration sessions (multi-user)

3. **Integration Guides**
   - GitHub Actions setup (with template)
   - GitLab CI setup (with template)
   - Slack integration (viewpoint sharing)
   - VS Code integration (post-MVP)
   - IntelliJ integration (post-MVP)

4. **Deployment Guide**
   - Helm chart configuration
   - Production best practices
   - Scaling Neo4j for large codebases
   - CDN setup for web UI
   - Security considerations

**Documentation Hosting:**
- Main site: `https://diagram-builder.io`
- Docs: `https://docs.diagram-builder.io`
- API Reference: `https://api-docs.diagram-builder.io`

### Migration & Versioning

**Versioning Strategy:**
- Semantic versioning (MAJOR.MINOR.PATCH)
- Breaking changes only in major versions
- Neo4j schema migrations included in releases
- CLI backward compatibility within major versions

**Upgrade Path:**

```bash
# Backup Neo4j data before upgrade
docker exec neo4j-container neo4j-admin backup

# Upgrade Helm chart
helm upgrade diagram-builder diagram-builder/diagram-builder \
  --version 2.0.0 \
  --reuse-values

# Run database migrations automatically
# (Helm chart runs migration job)
```

**Breaking Change Migration:**

When upgrading across major versions:
1. **Database Schema**: Auto-migration scripts run via Helm job
2. **CLI Commands**: Deprecation warnings for 1 major version before removal
3. **API Endpoints**: `/v1/` and `/v2/` versioned endpoints for compatibility
4. **Export Formats**: Maintain backward compatibility for standard formats

**Configuration Migration:**

```bash
# Migrate workspace config from v1 to v2
diagram-builder migrate workspace ./workspace-v1.json --output ./workspace-v2.json

# Validate migration
diagram-builder validate workspace ./workspace-v2.json
```

### Implementation Considerations

**Key Technical Decisions:**

1. **Node.js Backend**: Enables JavaScript/TypeScript parsing without additional tooling, shared language across stack
2. **Docker-First Development**: One-command setup eliminates "works on my machine" issues
3. **Helm for Deployment**: Cloud-native, industry-standard Kubernetes deployment
4. **CDN for Web UI**: Global performance, scalability, cost-effective hosting
5. **CLI + API Dual Interface**: Supports both automation (CI/CD) and programmatic access

**Development Workflow:**

```bash
# Developer setup (first time)
git clone repo && npm run setup

# Daily development
npm run dev        # Start all services with hot reload
npm run test       # Run tests
npm run lint       # Lint and format code

# Testing
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests (requires Docker)
npm run test:e2e           # End-to-end tests (browser automation)

# Building
npm run build              # Build all services
npm run docker:build       # Build Docker images
npm run helm:package       # Package Helm chart
```

**Repository Structure:**

```
diagram-builder/
├── docker-compose.yml          # Local development setup
├── Makefile                    # Convenience commands
├── src/
│   ├── parser/                # Parsing engine (TypeScript)
│   ├── api/                   # REST/WebSocket API (TypeScript)
│   ├── cli/                   # CLI tool (TypeScript)
│   ├── ui/                    # Web UI (React/Vue + TypeScript)
│   ├── graph/                 # Neo4j graph operations
│   ├── metrics/               # Code metrics calculation
│   └── shared/                # Shared utilities and types
├── helm/
│   └── diagram-builder/       # Helm chart
├── scripts/
│   ├── setup.sh              # Development setup
│   ├── ci-*.sh               # CI/CD scripts
│   └── migrate-*.sh          # Migration scripts
├── docs/
│   ├── getting-started.md
│   ├── api-reference/        # Auto-generated
│   └── architecture/         # Auto-generated diagrams
├── examples/
│   ├── github-actions/       # CI templates
│   ├── gitlab-ci/           # CI templates
│   └── workspaces/          # Example workspace configs
├── neo4j/
│   └── init/                 # Database initialization scripts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── dist/                      # Build output (gitignored)
    ├── parser/
    ├── api/
    ├── cli/
    └── ui/
```

**IDE Integration (Post-MVP):**

*VS Code Extension:*
- Command: "Open in diagram_builder" (right-click file/class/method)
- Viewpoint navigation: Click viewpoint link in comment → opens web UI
- Reverse navigation: Click in 3D → jumps to code in VS Code

*IntelliJ Plugin:*
- Tool window showing mini diagram view
- Navigate to declaration from 3D visualization
- Share viewpoints via IDE action

Both integrations deferred to post-MVP (after validating core platform adoption).

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Platform MVP - Build the foundational infrastructure (parsing, visualization, navigation, collaboration) that enables future expansion and validates core innovation (spatial code navigation with automatic LOD).

**Strategic Rationale:**
- **Prove Core Value First**: Validate that spatial 3D navigation with LOD actually helps developers understand architecture faster than traditional methods
- **Infrastructure-First Thinking**: Docker, Helm, CI/CD automation from day one ensures production-readiness at launch
- **Defer High-Risk Innovation**: Temporal and runtime integration (tri-dimensional analysis) delayed until platform adoption validates demand
- **Sequential Phase Gates**: Each phase builds on validated foundation - Phase 2 completion is critical go/no-go decision point for LOD system

**Resource Requirements:**
- **Team Size**: 3-4 full-stack TypeScript engineers (backend + frontend + 3D visualization expertise)
- **Timeline**: 7-8 months (30 weeks) across 4 sequential phases
- **Infrastructure**: Docker, Neo4j, Kubernetes/Helm, Three.js, Tree-sitter
- **Expertise Needed**: Graph databases, 3D rendering/WebGL, code parsing, developer tool UX

### MVP Feature Set (Phases 1-4: Weeks 1-30)

**Core User Journeys Supported:**

1. **Sarah Chen (Software Architect)** - ✅ Full Support
   - Multi-codebase parsing and visualization
   - Fast rendering and navigation
   - Viewpoint sharing with coordinates
   - Export to PlantUML for presentations

2. **Marcus Johnson (Developer Onboarding)** - ✅ Full Support
   - Workspace loading and exploration
   - Search functionality across codebase
   - Path tracing and navigation
   - Export to Mermaid for design proposals

3. **Dev Patel (DevOps Engineer)** - ✅ Full Support
   - CLI/API for headless operation
   - GitHub Actions integration
   - Batch export (PlantUML, Mermaid) at multiple LOD levels
   - Fast CI/CD performance (<3 min total)

4. **Priya Sharma (Technical Writer)** - ✅ Full Support
   - Non-developer-friendly interface
   - Pre-configured LOD profiles (Architecture, Security Audit)
   - Export to PlantUML/C4 for documentation
   - Consistent styling across exports

5. **James Rivera (Engineering Manager)** - ⚠️ Partial Support (Manual Mode)
   - Impact visualization (show callers/dependencies)
   - Viewpoint creation and sharing
   - **DEFERRED**: Automated PR integration and CI-generated viewpoints (manual viewpoint sharing works for MVP)

**Must-Have Capabilities:**

**Phase 1 - Parsing Engine (Weeks 1-8):**
- Parse JavaScript/TypeScript codebases via Tree-sitter
- Extract structure to language-agnostic intermediate representation
- Populate Neo4j graph database with nodes and relationships
- Calculate basic metrics (complexity, coupling, fan-in/fan-out, dependencies)
- Query performance: <1 second for common patterns
- Docker Compose development environment with one-command setup

**Phase 2 - Visualization + LOD (Weeks 9-16):**
- 3D rendering with Three.js/WebGL in browser
- Automatic Level-of-Detail (LOD) system with smooth transitions
- Pre-configured LOD profiles: Architecture Review, Security Audit, Code Review
- Force-directed layout algorithm
- Navigate from architecture view → method level seamlessly
- Performance: 60fps with 1000+ visible nodes
- Hidden-by-default philosophy (show only entry points, APIs, data models initially)
- **CRITICAL VALIDATION GATE**: User testing validates LOD helps vs. confuses before Phase 3

**Phase 3 - Navigation Suite (Weeks 17-22):**
- Coordinate system: `file:class:method:line` format for precise location sharing
- Integrated search across Neo4j codebase graph
- Dual mini-map system (2D file tree + 3D spatial view with independent filters)
- HUD with breadcrumbs, current context, navigation history
- Spatial filtering via mini-map interaction
- Path tracing through dependencies
- Impact analysis visualization (show affected code)

**Phase 4 - Collaboration & Export (Weeks 23-30):**
- Viewpoint system (save camera position + filters + annotations, share via URL)
- Export formats: PlantUML, Mermaid, Draw.io, GLTF (3D with metadata)
- LOD-level selection for exports (system/service/file/class/method views)
- Multi-user collaborative sessions with spatial avatars
- Coordinate-based communication ("meet me at auth-service:L145")
- Real-time position updates via WebSocket

**MVP Scope Boundaries:**
- ✅ JavaScript/TypeScript only (prove concept without multi-language complexity)
- ✅ Static analysis only (git history and debugger integration deferred to Growth)
- ✅ Single codebase primary, multi-codebase secondary (both work, optimization focuses on single)
- ✅ Web-first (browser-based, no native desktop app)
- ✅ Basic collaboration (read-only exploration, not simultaneous editing)
- ✅ Manual viewpoint sharing (automated PR integration deferred to Growth)

**MVP Success = All 4 phases complete with validated LOD system, users understand architecture faster, CI/CD adoption begins**

### Post-MVP Features

**Phase 5: Growth Features (Post-MVP, Months 8-12)**

**Temporal Visualization - Git History Integration:**
- Scrub through repository history to watch codebase evolution
- See dependencies appear, classes split, modules grow over time
- Identify architectural drift and decay patterns
- Collapsed LOD elements show aggregate change visualization
- **Business Value**: Answer "How did we get here?" - understand why architecture evolved to current state
- **User Demand**: Only build if MVP users explicitly request historical perspective

**Execution Flow Visualization - Debugger Integration:**
- Connect to running debugger sessions (Node.js inspector protocol)
- Follow execution step-by-step through 3D codebase
- Map runtime behavior to code structure
- Visualize actual code paths vs. potential paths
- **Business Value**: Answer "What happens when I run this?" - understand actual execution behavior
- **Risk**: Second-highest innovation risk after LOD - defer until platform validates

**Automated PR Integration (Complete Journey 5):**
- Git integration (trigger parsing on PR creation)
- Highlight/filter changed code elements in 3D view
- Automated viewpoint generation from CI with impact analysis
- PR comment posting with viewpoint links
- **Business Value**: Makes code review faster and more thorough
- **Prerequisite**: CI/CD adoption validated in MVP

**Advanced Export Capabilities:**
- Multi-view sheet export (multiple perspectives in single document)
- Annotation system (add notes directly to viewpoints)
- Interactive PDF export (clickable, navigable)
- Animated SVG exports for data flow visualization

**Platform Expansion:**
- GitLab CI templates and integration (beyond GitHub Actions)
- Multi-language support: Python, Java, Go, Ruby parsers
- Unified multi-language codebase visualization

**Phase 6: Expansion Features (Year 2+)**

**Living Architecture Platform:**
- Real-time streaming parsing (watch mode for live updates during development)
- Runtime telemetry integration (live performance data overlaid on structure)
- AI/LLM semantic labeling (intelligent pattern recognition and suggestions)
- Automated migration assistant (refactoring suggestions based on visualization)
- **Full Tri-Dimensional Analysis**: Static code + runtime behavior + git history unified

**Advanced Collaboration:**
- Code review as spatial exploration (PR changes visualized in 3D)
- Architecture Decision Records (ADRs) linked to spatial locations
- Team knowledge capture (annotations, insights, tribal knowledge preserved in viewpoints)
- Presentation mode (record and playback navigation sequences for walkthroughs)

**Ecosystem Integration:**
- VS Code extension (right-click → open in diagram_builder, bidirectional navigation)
- IntelliJ plugin (tool window with mini diagram, navigate to declaration from 3D)
- Project management integration (Jira, Linear - link issues to code locations)
- Monitoring integration (Datadog, New Relic - link alerts to architecture)
- Documentation platforms (Notion, Confluence - embed interactive diagrams)

**Enterprise Features:**
- Self-hosted deployment options (on-premises, air-gapped environments)
- Access control and permissions (RBAC, SSO integration)
- Multi-repository workspace management (enterprise-wide architectural analysis)
- Version control across visualizations (track architectural changes over time)
- Team analytics and usage tracking (adoption metrics, value demonstration)

**Multi-Purpose Intelligence:**
- Test coverage mapping to 3D visualization (see tested vs. untested code spatially)
- Security auditing (vulnerability detection, data flow tracing for compliance)
- Performance profiling (static anti-pattern detection: N+1 queries, memory leaks)
- Documentation auto-generation from LOD views (living architecture docs)
- Code quality gates (pre-commit architectural rule enforcement)
- Dependency auditor (license compliance across all dependencies)
- Code clone detection (duplicate code visualization and refactoring opportunities)

### Risk Mitigation Strategy

**Technical Risks:**

**Risk #1: LOD System User Validation** - *Second Highest Risk*
- **Risk**: Automatic LOD disorients users (detail appearing/disappearing), "hidden by default" hides wrong elements
- **Mitigation**: Early adopter testing in Phase 2 (weeks 9-16), manual LOD override fallback, configurable profiles
- **Validation Metrics**: Time to find architectural bottlenecks 50%+ faster with LOD vs. without, minimal manual override usage
- **Go/No-Go Gate**: Phase 2 completion - if LOD confuses more than helps, pivot to simpler discrete zoom levels before Phase 3
- **Fallback**: Offer manual LOD controls, simpler zoom levels (System → Service → File → Class → Method) without smooth transitions

**Risk #2: Tri-Dimensional Integration Complexity** - *Highest Risk (Deferred)*
- **Risk**: Combining static + temporal + runtime proves too complex (conflicting data, performance degradation, cognitive overload)
- **Mitigation**: **DEFERRED to Growth phase**, each dimension works standalone first
- **Validation Strategy**: Phased implementation - validate static (MVP), add temporal (Growth), then runtime (Expansion)
- **De-risking**: Only build if MVP users explicitly request historical and runtime perspectives
- **Fallback**: Deliver as three separate modes users switch between, not simultaneous overlay

**Risk #3: Multi-Codebase Performance at Scale**
- **Risk**: Parsing 23-service microservice architecture is too slow, Neo4j query performance degrades
- **Mitigation**: Aggressive indexing, query optimization, caching, progressive loading
- **Validation**: Performance benchmarks at Phase 1 completion (parse 5000 files in <2 min)
- **Fallback**: Optimize for single codebase first, multi-repo as secondary feature with performance warnings

**Risk #4: Three.js Rendering Performance**
- **Risk**: Complex scenes with thousands of nodes drop below 60fps
- **Mitigation**: Instanced rendering, frustum culling, LOD-based geometry reduction, spatial partitioning
- **Validation**: Phase 2 performance testing with large codebases
- **Fallback**: Limit visible nodes, provide 2D mini-map fallback for complex navigation

**Market Risks:**

**Risk #1: "Too Novel" - 3D Navigation Rejected**
- **Risk**: Developers prefer familiar 2D diagrams, 3D spatial metaphor doesn't resonate, learning curve too steep
- **Validation**: Phase 2 user testing - measure time-to-architectural-understanding vs. traditional 2D diagrams
- **Mitigation**: Export to familiar formats (PlantUML, Mermaid) as bridge, guided onboarding, 2D mini-map as orientation fallback
- **Pivot Option**: If 3D fails validation, become best-in-class automated 2D diagram generator with PlantUML/Mermaid focus
- **Success Indicator**: Users complete onboarding in <30 minutes and prefer 3D for architectural understanding

**Risk #2: Developer Tool Fatigue**
- **Risk**: Teams won't adopt another tool to learn, already overwhelmed with dev tools
- **Validation**: CI/CD integration adoption rate (target: 60% of active teams within 6 months)
- **Mitigation**: Make it infrastructure (automated in pipelines) not a tool (manual daily usage)
- **Success Indicator**: "Set it and forget it" usage - diagrams update automatically, users don't think about the tool

**Risk #3: Parsing Accuracy Concerns**
- **Risk**: Users don't trust visualization if parsing misses dependencies or misrepresents structure
- **Validation**: Parsing accuracy validation at 95%+ on test codebases (Phase 1 completion)
- **Mitigation**: Comprehensive testing across diverse codebases, community contribution for edge cases
- **Transparency**: Show parsing confidence scores, warn about unrecognized patterns

**Resource Risks & Contingency Plans:**

**Scenario 1: Fewer Resources Than Planned**
- **Minimum Team**: 2-3 engineers (full-stack TypeScript developers)
- **Reduced Scope**: Cut Phase 4 (collaboration features), deliver Phases 1-3 only
- **Delivered Value**: Parsing + visualization + navigation + export (single-user mode)
- **Manual Workarounds**: Users export diagrams manually instead of CI/CD automation
- **Timeline Impact**: MVP reduces to 5-6 months instead of 7-8 months
- **User Journeys Supported**: Sarah (bottleneck finding), Marcus (onboarding), Priya (documentation) - 3 of 5 journeys

**Scenario 2: Absolute Minimum Viable Version**
- **Ultra-Lean Scope**: Phase 1 + 2 only (parsing + visualization with LOD)
- **Features**: Parse JS/TS, 3D visualization, automatic LOD, export to PlantUML
- **No Collaboration**: Single-user mode only (no multi-user, no viewpoint sharing)
- **Manual Operation**: No CI/CD automation, no CLI (web UI only)
- **Timeline**: 4 months (16 weeks)
- **Value Delivered**: Still solves Sarah's core problem (find bottlenecks visually in hours vs. days)
- **Validation Focus**: Proves LOD system works and 3D navigation provides value
- **Expansion Path**: Add Phase 3-4 features based on user feedback and funding

**Scenario 3: Extended Timeline (More Validation)**
- **Conservative Approach**: Add 2-month validation period after Phase 2
- **Extended Timeline**: 9-10 months total (vs. 7-8 months)
- **Additional Validation**: Extensive LOD user testing, beta program with 10+ teams
- **Risk Reduction**: Lower chance of building unwanted features, higher confidence in Phase 3-4
- **Trade-off**: Slower time-to-market, but higher product-market fit confidence

**Validation Gates Before Scaling:**
- **Phase 1 Completion (Week 8)**: Parsing accuracy validated at 95%+, performance benchmarks met
- **Phase 2 Completion (Week 16)**: **CRITICAL GO/NO-GO** - LOD system validated as helpful, 3D navigation resonates with users
- **MVP Launch (Week 30)**: Static visualization adoption validated before investing in temporal/runtime integration
- **Post-MVP (Month 8+)**: Only add tri-dimensional integration if users explicitly request historical and runtime perspectives

## Functional Requirements

This section defines **THE CAPABILITY CONTRACT** for diagram_builder. Every feature must trace back to these requirements. UX designers will design interactions for these capabilities, architects will build systems to support them, and developers will implement them.

Each functional requirement (FR) specifies **WHAT capability exists**, not **HOW to implement it**. Requirements are implementation-agnostic and testable.

### Code Parsing & Analysis

- FR1: System can parse JavaScript codebases and extract structural information (files, classes, functions, imports, dependencies)
- FR2: System can parse TypeScript codebases and extract structural information with type relationships
- FR3: System can identify all code dependencies (import statements, function calls, class inheritance, module relationships)
- FR4: System can calculate code metrics (complexity, coupling, fan-in, fan-out, lines of code)
- FR5: System can store parsed code structure in queryable graph database format
- FR6: System can process repositories from local file system paths
- FR7: System can process repositories from hosted Git URLs (GitHub, GitLab, Bitbucket)
- FR8: System can parse multiple codebases simultaneously for multi-service analysis
- FR9: System can update existing parsed codebase when source code changes

### 3D Visualization & Rendering

- FR10: System can render code structure as interactive 3D visualization in web browser
- FR11: System can apply force-directed layout algorithm to position code elements spatially based on relationships
- FR12: System can automatically adjust level of detail based on camera zoom level
- FR13: System can maintain 60fps rendering performance with 1000+ visible code elements
- FR14: System can apply pre-configured visualization profiles (Architecture Review, Security Audit, Code Review, Performance Analysis)
- FR15: System can hide non-essential code elements by default (showing only entry points, APIs, data models initially)
- FR16: System can visualize dependency relationships as connections between code elements
- FR17: System can highlight architectural patterns visually (layers, boundaries, coupling hotspots)
- FR18: System can represent code complexity through visual properties (size, color, weight)

### Navigation & Discovery

- FR19: Users can navigate 3D codebase using camera controls (pan, zoom, rotate, orbit)
- FR20: Users can search codebase for specific elements (files, classes, methods, keywords)
- FR21: System can display search results with navigation to exact 3D location
- FR22: Users can navigate to specific code location using coordinate format (service:class:method:line)
- FR23: System can display current location context (breadcrumbs showing file → class → method hierarchy)
- FR24: System can display HUD with navigation history and current position information
- FR25: Users can view dual mini-map (2D file tree structure and 3D spatial overview)
- FR26: Users can filter visible code elements using mini-map interaction
- FR27: System can trace execution paths through code dependencies
- FR28: System can visualize impact analysis showing all code affected by specific element changes

### Workspace & Configuration Management

- FR29: Users can save workspace configurations (multi-codebase setups with specific repositories)
- FR30: Users can load previously saved workspace configurations
- FR31: Users can configure parsing settings (languages, exclude patterns, metric thresholds)
- FR32: System can persist workspace state across sessions (camera position, filters, selections)
- FR33: Users can create custom LOD profiles for specific use cases
- FR34: System can apply team-wide configuration templates for consistent visualization

### Collaboration & Sharing

- FR35: Users can save viewpoints (camera position + filters + visible elements + annotations)
- FR36: Users can share viewpoints via URL links
- FR37: System can restore complete viewpoint context from shared URL (camera, filters, annotations)
- FR38: Users can add text annotations to viewpoints
- FR39: Users can participate in multi-user collaborative sessions
- FR40: System can display spatial avatars showing other users' current positions in codebase
- FR41: System can synchronize camera positions across users in real-time (WebSocket)
- FR42: Users can communicate using coordinate-based references in chat/comments
- FR43: System can display viewpoint metadata (creator, creation date, description)

### Export & Documentation Generation

- FR44: System can export current view as PlantUML diagram
- FR45: System can export current view as Mermaid diagram
- FR46: System can export current view as Draw.io compatible format
- FR47: System can export current view as 3D model (GLTF format with metadata)
- FR48: System can export current view as static image (PNG, SVG)
- FR49: System can select LOD level for exports (system, service, file, class, method abstraction)
- FR50: System can generate C4-style architecture diagrams from parsed code structure
- FR51: System can apply consistent styling across all exported diagrams
- FR52: System can export multi-view sheets (same architecture from multiple perspectives)
- FR53: System can include timestamp and metadata in exported diagrams

### CLI & Automation

- FR54: Users can parse codebases via command-line interface (CLI)
- FR55: Users can export diagrams via CLI in headless mode (no browser required)
- FR56: Users can configure export formats via CLI flags (plantuml, mermaid, gltf, png, svg)
- FR57: Users can specify LOD levels for CLI exports
- FR58: Users can run parsing and export operations in CI/CD pipelines
- FR59: System can complete parsing and export operations within 3 minutes for 5000 file projects (CI/CD performance requirement)
- FR60: System can validate generated exports via CLI commands

### Repository Integration

- FR61: System can authenticate with private Git repositories using access tokens
- FR62: System can clone specific Git branches for parsing
- FR63: System can automatically update visualization when repository changes (via webhook or polling)
- FR64: System can parse repositories without persisting clone (temporary processing)
- FR65: System can handle monorepo structures with multiple logical applications
- FR66: System can map cross-repository dependencies for microservices architecture

### REST API & Programmatic Access

- FR67: Developers can trigger parsing operations via REST API
- FR68: Developers can check parsing status and progress via REST API
- FR69: Developers can retrieve graph data via REST API
- FR70: Developers can generate exports programmatically via REST API
- FR71: Developers can create and retrieve viewpoints via REST API
- FR72: Developers can manage workspace configurations via REST API


## Non-Functional Requirements

Non-functional requirements specify HOW WELL the system must perform, not WHAT it must do. These define quality attributes like performance, security, integration, and scalability that are critical for diagram_builder's success.

We've included only categories that are relevant for this specific product. Accessibility and compliance categories have been omitted as they don't apply to a developer tool with low domain complexity.

### Performance

**Parsing Performance:**
- NFR-P1: Parse 100 files in less than 2 seconds
- NFR-P2: Complete full codebase parsing for 5000-file project in less than 2 minutes
- NFR-P3: Neo4j query response time for common patterns (dependency lookups, relationship queries) completes in less than 1 second
- NFR-P4: Memory usage remains under 500MB for projects with 5000 files
- NFR-P5: Docker environment setup completes in less than 5 minutes from clone to running state

**Visualization Performance:**
- NFR-P6: Maintain 60fps minimum frame rate with 1000+ visible nodes in 3D scene
- NFR-P7: LOD transitions execute smoothly without visible stuttering or frame drops
- NFR-P8: Initial 3D scene render completes in less than 3 seconds for medium-sized projects
- NFR-P9: Navigation input-to-render latency remains under 16ms (one frame at 60fps)
- NFR-P10: WebGL scene updates in response to user camera controls complete without perceptible lag

**Navigation & Search Performance:**
- NFR-P11: Search queries across codebase graph return results in less than 500ms
- NFR-P12: Mini-map view updates complete in less than 100ms
- NFR-P13: Navigation jumps to target location complete in less than 200ms
- NFR-P14: Coordinate-based location lookup and camera positioning completes in less than 300ms

**Collaboration Performance:**
- NFR-P15: Multi-user sessions support 10+ concurrent users per codebase without performance degradation
- NFR-P16: User position updates via WebSocket synchronize with less than 100ms latency
- NFR-P17: Viewpoint save operations complete in less than 500ms
- NFR-P18: Viewpoint load and camera restoration completes in less than 500ms

**Export Performance:**
- NFR-P19: Diagram export generation (PlantUML, Mermaid, GLTF) completes in less than 5 seconds for large diagrams
- NFR-P20: Complete CI/CD pipeline execution (parse + export) finishes in less than 3 minutes for 5000-file projects to avoid bottlenecking pull requests

### Security

**Authentication & Authorization:**
- NFR-S1: System supports secure authentication with private Git repositories using OAuth tokens or SSH keys
- NFR-S2: API endpoints require authentication tokens for all write operations (parse, save viewpoints, create workspaces)
- NFR-S3: Access tokens are stored encrypted at rest and never logged or exposed in responses
- NFR-S4: Multi-user collaborative sessions enforce user identity verification before joining
- NFR-S5: Workspace configurations enforce access control (only authorized users can view/modify specific workspaces)

**Data Protection:**
- NFR-S6: Repository credentials (tokens, SSH keys) are encrypted in transit and at rest
- NFR-S7: Code content parsed from repositories is not persistently stored outside Neo4j database
- NFR-S8: Neo4j database connections use encrypted connections (bolt+s://) in production deployments
- NFR-S9: Temporary repository clones are deleted immediately after parsing completes

**Network Security:**
- NFR-S10: All API endpoints use HTTPS/TLS encryption in production
- NFR-S11: WebSocket collaborative sessions use secure WebSocket protocol (wss://)
- NFR-S12: Cross-Origin Resource Sharing (CORS) policies restrict API access to authorized domains

**Deployment Security:**
- NFR-S13: Docker images are scanned for vulnerabilities before release
- NFR-S14: Kubernetes deployments follow least-privilege principle (non-root containers, restricted capabilities)
- NFR-S15: Helm charts support secret management via Kubernetes secrets (not plaintext passwords in values)

### Integration

**Repository Platform Compatibility:**
- NFR-I1: System integrates with GitHub repositories (public and private)
- NFR-I2: System integrates with GitLab repositories (public and private)
- NFR-I3: System integrates with Bitbucket repositories (public and private)
- NFR-I4: System supports Git operations over HTTPS and SSH protocols
- NFR-I5: System handles Git authentication errors gracefully with clear error messages

**CI/CD Integration:**
- NFR-I6: System provides GitHub Actions integration with official action template
- NFR-I7: System provides GitLab CI integration with pipeline template
- NFR-I8: CLI commands execute successfully in headless environments (no display server required)
- NFR-I9: Docker images are published to public container registry for CI/CD consumption
- NFR-I10: Exit codes from CLI commands indicate success/failure for CI/CD pipeline decision-making

**Export Format Compatibility:**
- NFR-I11: PlantUML exports are valid and render correctly in standard PlantUML renderers
- NFR-I12: Mermaid exports are valid and render correctly in GitHub markdown and Mermaid Live Editor
- NFR-I13: GLTF 3D exports are valid and load correctly in standard 3D viewers (Blender, three.js viewers)
- NFR-I14: Draw.io exports import correctly into Draw.io editor without errors
- NFR-I15: PNG/SVG exports maintain visual fidelity and readability at standard documentation sizes

**API Standards:**
- NFR-I16: REST API follows RESTful conventions (proper HTTP verbs, status codes, resource naming)
- NFR-I17: API responses use standard JSON format with consistent error structures
- NFR-I18: WebSocket events follow consistent event naming and payload schemas
- NFR-I19: API documentation is auto-generated from code and stays synchronized with implementation

**Browser Compatibility:**
- NFR-I20: Web UI functions correctly in Chrome (latest 2 versions)
- NFR-I21: Web UI functions correctly in Firefox (latest 2 versions)
- NFR-I22: Web UI functions correctly in Safari (latest 2 versions)
- NFR-I23: Web UI functions correctly in Edge (latest 2 versions)
- NFR-I24: WebGL rendering degrades gracefully on browsers with limited GPU capabilities

### Scalability

**Codebase Size Scalability:**
- NFR-SC1: System handles codebases up to 10,000 files without architectural changes
- NFR-SC2: System handles codebases up to 1 million lines of code with acceptable performance (less than 5 minute parse time)
- NFR-SC3: Neo4j database scales to store graphs with 100,000+ nodes (files, classes, methods) and 500,000+ relationships
- NFR-SC4: 3D visualization handles progressive loading for extremely large codebases (100,000+ files) using chunking and spatial partitioning

**User Scalability:**
- NFR-SC5: Single diagram_builder instance supports 100+ concurrent single-user sessions
- NFR-SC6: Single collaborative session supports 50+ concurrent users (exceeding target of 10+ for MVP)
- NFR-SC7: System maintains performance with 1000+ saved viewpoints per workspace

**Infrastructure Scalability:**
- NFR-SC8: Kubernetes deployment supports horizontal scaling (add replicas) for parsing service
- NFR-SC9: Neo4j database supports clustering for high-availability production deployments
- NFR-SC10: WebSocket server supports horizontal scaling with sticky session load balancing
- NFR-SC11: Static assets (web UI) can be deployed to CDN for global distribution and caching

**Multi-Repository Scalability:**
- NFR-SC12: System handles workspaces with 50+ repositories loaded simultaneously (microservices architecture)
- NFR-SC13: Cross-repository dependency analysis scales to 100,000+ total nodes across all repositories
- NFR-SC14: Multi-codebase visualization maintains 60fps performance with LOD optimization

**Data Growth:**
- NFR-SC15: Workspace configurations support versioning and history (100+ versions per workspace)
- NFR-SC16: Viewpoint storage scales to 10,000+ viewpoints across all users without performance impact
- NFR-SC17: Annotation system supports 1000+ annotations per viewpoint without rendering performance degradation
