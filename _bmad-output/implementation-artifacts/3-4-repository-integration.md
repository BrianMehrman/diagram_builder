# Story 3-4: Repository Integration

## Story

**ID:** 3-4
**Key:** 3-4-repository-integration
**Title:** Implement local directory scanning and Git repository cloning
**Epic:** Epic 3 - Parser Package (@diagram-builder/parser)
**Phase:** Phase 3 - Parser Package

**Description:**

Implement repository integration capabilities to parse codebases from local directories and remote Git repositories. This story enables the parser to work with real-world projects by scanning file systems, cloning Git repositories, and supporting multiple Git hosting platforms (GitHub, GitLab, Bitbucket).

This integration layer provides the entry point for the entire parsing pipeline, connecting external codebases to the analysis and visualization system.

**Dependencies:**
- Story 3-1 (Tree-sitter Integration) must be complete
- Story 3-2 (AST Analysis) must be complete
- Story 3-3 (Dependency Graph Construction) must be complete

---

## Acceptance Criteria

- **AC-1:** Local directory scanning implemented
  - Recursively scan directories for JavaScript/TypeScript files
  - Filter by file extensions (.js, .ts, .tsx, .jsx)
  - Respect .gitignore patterns to exclude node_modules, dist, etc.
  - Support configurable ignore patterns
  - Return list of absolute file paths for parsing

- **AC-2:** Git repository cloning implemented
  - Clone remote Git repositories to temporary directory
  - Support HTTPS repository URLs (GitHub, GitLab, Bitbucket)
  - Support SSH repository URLs (git@github.com:user/repo.git)
  - Clean up temporary directories after parsing
  - Handle clone failures with clear error messages

- **AC-3:** Authentication support implemented
  - Support OAuth tokens via environment variables
  - Support SSH keys for git clone operations
  - Pass authentication credentials to Git operations securely
  - Handle authentication failures gracefully
  - NO credentials stored in code or logs

- **AC-4:** Branch-specific parsing support
  - Clone specific Git branch when specified
  - Default to main/master branch if not specified
  - Support tag-based cloning (e.g., v1.0.0)
  - Support commit SHA-based cloning
  - Validate branch exists before cloning

- **AC-5:** Integration tests with real repositories
  - Test local directory scanning with test fixtures
  - Test Git clone with public GitHub repository
  - Test .gitignore pattern exclusions
  - Test branch-specific cloning
  - Tests co-located with source files (.test.ts suffix)
  - All tests pass 100%

---

## Tasks/Subtasks

### Task 1: Implement local directory scanner
- [ ] Create `src/repository/directory-scanner.ts` module
- [ ] Implement `scanDirectory(path: string, options: ScanOptions): Promise<string[]>` function
- [ ] Define `ScanOptions` interface (extensions, ignorePatterns, maxDepth)
- [ ] Recursively traverse directory structure using fs.readdir
- [ ] Filter files by extension (.js, .ts, .tsx, .jsx)
- [ ] Parse and apply .gitignore patterns (use ignore npm package)
- [ ] Return array of absolute file paths
- [ ] Write unit tests in `directory-scanner.test.ts`

### Task 2: Implement Git repository cloning
- [ ] Create `src/repository/git-cloner.ts` module
- [ ] Install `simple-git` npm package for Git operations
- [ ] Implement `cloneRepository(url: string, options: CloneOptions): Promise<string>` function
- [ ] Define `CloneOptions` interface (branch, auth, targetDir, depth)
- [ ] Clone repository to temporary directory (use os.tmpdir())
- [ ] Support shallow clones (--depth 1) for performance
- [ ] Return path to cloned repository
- [ ] Write unit tests in `git-cloner.test.ts`

### Task 3: Implement authentication handling
- [ ] Create `src/repository/auth-provider.ts` module
- [ ] Implement `getAuthConfig(): AuthConfig` function
- [ ] Define `AuthConfig` interface (type: oauth | ssh, token, sshKeyPath)
- [ ] Read OAuth token from environment variable (DIAGRAM_BUILDER_TOKEN)
- [ ] Detect SSH key from ~/.ssh/id_rsa or SSH_KEY_PATH env var
- [ ] Configure simple-git with authentication credentials
- [ ] NEVER log or store credentials in code
- [ ] Write unit tests in `auth-provider.test.ts` (mock env vars)

### Task 4: Implement branch and tag support
- [ ] Update `cloneRepository` to accept branch parameter
- [ ] Use `git clone -b <branch>` for branch-specific clones
- [ ] Implement `listRemoteBranches(url: string): Promise<string[]>` function
- [ ] Validate branch exists before attempting clone
- [ ] Support Git tags in addition to branches
- [ ] Support commit SHA cloning
- [ ] Write unit tests in `git-cloner.test.ts`

### Task 5: Implement cleanup and resource management
- [ ] Create `src/repository/cleanup.ts` module
- [ ] Implement `cleanupRepository(path: string): Promise<void>` function
- [ ] Remove temporary clone directories after parsing
- [ ] Handle cleanup failures gracefully (log warnings)
- [ ] Add process exit handlers to cleanup on crash
- [ ] Write unit tests in `cleanup.test.ts`

### Task 6: Create unified repository interface
- [ ] Create `src/repository/repository-loader.ts` module
- [ ] Implement `loadRepository(source: string | RepositoryConfig): Promise<RepositoryContext>` function
- [ ] Define `RepositoryContext` interface (path, files, metadata)
- [ ] Auto-detect if source is local path or Git URL
- [ ] Combine directory scanning with repository cloning
- [ ] Integrate with parsing pipeline (use Story 3-2, 3-3 utilities)
- [ ] Write integration tests in `repository-loader.test.ts`

### Task 7: Validate and run all tests
- [ ] Run `npm test` in @diagram-builder/parser package
- [ ] Verify all tests pass 100%
- [ ] Test with real public GitHub repository (e.g., small open-source project)
- [ ] Test .gitignore exclusions work correctly
- [ ] Run TypeScript type checking (`tsc --noEmit`)
- [ ] Run ESLint validation
- [ ] Fix any failing tests or linting issues

---

## Dev Notes

### Architecture Context

**Package Location:** `packages/parser/`
**Package Name:** `@diagram-builder/parser`

**Dependencies:**
- Story 3-1 (Tree-sitter Integration) - REQUIRED
- Story 3-2 (AST Analysis) - REQUIRED
- Story 3-3 (Dependency Graph) - REQUIRED
- npm packages: `simple-git`, `ignore`, `tmp` or use os.tmpdir()

**Technology Stack:**
- simple-git: Node.js Git wrapper
- ignore: .gitignore pattern matching
- Node.js fs/path for file system operations
- Vitest for testing

### Key Architecture Decisions

1. **Git Integration Strategy:**
   - Use simple-git library (mature, well-tested)
   - Clone to temporary directory, parse, cleanup
   - Support shallow clones (--depth 1) for performance

2. **Authentication Security (NFR-S1 to NFR-S5):**
   - OAuth tokens from environment variables ONLY
   - SSH keys from standard locations (~/.ssh/)
   - NEVER store credentials in code, config, or logs
   - Use encrypted credential storage in production

3. **Performance Requirements (NFR-P1):**
   - Shallow clone (--depth 1) to reduce clone time
   - Parallel file scanning when possible
   - Respect .gitignore to avoid parsing unnecessary files

4. **Platform Support (Architecture):**
   - GitHub: https://github.com/user/repo.git or git@github.com:user/repo.git
   - GitLab: https://gitlab.com/user/repo.git or git@gitlab.com:user/repo.git
   - Bitbucket: https://bitbucket.org/user/repo.git or git@bitbucket.org:user/repo.git

### Implementation Guidance

**Directory Scanning Pattern:**
```typescript
async function scanDirectory(path: string, options: ScanOptions): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(path, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(path, entry.name);
    if (entry.isDirectory()) {
      if (!shouldIgnore(entry.name, options.ignorePatterns)) {
        const subFiles = await scanDirectory(fullPath, options);
        files.push(...subFiles);
      }
    } else if (matchesExtension(entry.name, options.extensions)) {
      files.push(fullPath);
    }
  }

  return files;
}
```

**Git Clone Pattern:**
```typescript
import simpleGit from 'simple-git';

async function cloneRepository(url: string, options: CloneOptions): Promise<string> {
  const tmpDir = os.tmpdir();
  const targetPath = path.join(tmpDir, `diagram-builder-${Date.now()}`);

  const git = simpleGit();
  await git.clone(url, targetPath, {
    '--branch': options.branch || 'main',
    '--depth': 1, // Shallow clone
  });

  return targetPath;
}
```

**Authentication Configuration:**
- Environment variable: `DIAGRAM_BUILDER_TOKEN` for OAuth tokens
- Environment variable: `SSH_KEY_PATH` for custom SSH key location
- Default SSH key: `~/.ssh/id_rsa`

### Critical Constraints

- **Security (NFR-S1 to NFR-S5):** NO credential storage in code/logs
- **TypeScript strict mode:** NO `any` types allowed
- **Co-located tests:** `.test.ts` files next to source files
- **Resource cleanup:** Always cleanup temp directories (use try/finally)

### Testing Requirements

Tests must include:
- Local directory scanning with nested folders
- .gitignore pattern exclusions (node_modules, dist, .env)
- Git clone with public repository (GitHub)
- Branch-specific cloning
- Mock tests for authentication (don't use real credentials in tests)
- Cleanup verification (temp directories removed)

### Reference Files

- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Project Context: `_bmad-output/project-context.md`
- Phase Overview: `TASKS.md` (Phase 3.4)

---

## Dev Agent Record

### Implementation Plan
<!-- AI Dev Agent: Document high-level approach before implementation -->

### Debug Log
<!-- AI Dev Agent: Record issues encountered and resolutions -->

### Completion Notes
<!-- AI Dev Agent: Summarize what was implemented and tested -->

---

## File List

<!-- AI Dev Agent: List ALL new/modified/deleted files (relative paths) -->
<!-- Format: [NEW|MOD|DEL] path/to/file.ts -->

---

## Change Log

<!-- AI Dev Agent: Add entry after each implementation session -->
<!-- Format: - Description of changes (Date: YYYY-MM-DD) -->

---

## Status

**Current Status:** not-started
**Created:** 2025-12-29
**Last Updated:** 2025-12-29
