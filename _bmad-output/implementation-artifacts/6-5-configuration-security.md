# Story 6-5: Configuration & Security

## Story

**ID:** 6-5
**Key:** 6-5-configuration-security
**Title:** Implement File Storage Management, Repo Size Limits, and Secret Scanning
**Epic:** Epic 6 - Fix Parser & Complete Core Integration
**Phase:** Implementation
**Priority:** MEDIUM - Operational Readiness & Security

**Description:**

Implement operational and security infrastructure for safe, production-ready codebase parsing. Add file storage management, repository size limits, secret scanning, and comprehensive environment configuration.

**Context:**

From brainstorming session Question Storming, we identified 10+ configuration and security questions:
- "Where do files get saved when the application is running?"
- "Is there a maximum size of a file or repo that can be scanned?"
- "What security do we need to build around files that could have secrets in them?"
- "What configurations are environment instance vs environment class/type?"

Current gaps:
- No file storage cleanup strategy
- No repository size limits (potential DoS)
- No secret detection (could leak credentials)
- Configuration spread across multiple files
- No documentation of environment variables

This story addresses operational stability and security concerns.

---

## Acceptance Criteria

- **AC-1:** File storage management implemented
  - Temporary files cleaned up after parsing
  - Maximum storage limit enforced
  - Old/unused repositories cleaned up
  - Disk space monitoring (optional)
  - Configurable cleanup policies

- **AC-2:** Repository size limits enforced
  - Maximum repository size configurable (default: 500MB)
  - Maximum file count configurable (default: 10,000 files)
  - Maximum individual file size (default: 10MB)
  - Limits checked before cloning/parsing
  - Clear error messages when limits exceeded

- **AC-3:** Secret scanning implemented
  - Scan for common secret patterns (API keys, tokens, passwords)
  - Warn when secrets detected (or fail based on config)
  - Configurable secret patterns
  - Log detected secrets (redacted) for security audit
  - Option to obscure secrets in stored data

- **AC-4:** Environment configuration documented
  - All environment variables documented in .env.example
  - Separate configs for development, staging, production
  - Configuration validation on startup
  - Default values for all optional configs
  - README section on configuration

- **AC-5:** Configuration injectable and validated
  - Use environment variables for all configs
  - Validate configs on application startup
  - Fail fast if required configs missing
  - Type-safe configuration loading (Zod schemas)
  - No hardcoded values in source code

---

## Tasks/Subtasks

### Task 1: Implement file storage management
- [ ] Define file storage location (temp directory or configurable path)
- [ ] Implement cleanup after successful parse
- [ ] Implement cleanup after failed parse
- [ ] Add configurable retention policy (keep for X hours/days)
- [ ] Add background cleanup job for old files
- [ ] Document storage requirements

### Task 2: Add repository size validation
- [ ] Add MAX_REPO_SIZE_MB environment variable
- [ ] Add MAX_FILE_COUNT environment variable
- [ ] Add MAX_FILE_SIZE_MB environment variable
- [ ] Check repository size before cloning (Git repos only)
- [ ] Check file count during directory scan
- [ ] Check individual file sizes before reading
- [ ] Return clear error when limits exceeded
- [ ] Log size violations for monitoring

### Task 3: Implement secret scanning
- [ ] Install or create secret detection library
- [ ] Define secret patterns:
  - AWS access keys (AKIA...)
  - GitHub tokens (ghp_...)
  - Private keys (-----BEGIN PRIVATE KEY-----)
  - Generic API key patterns
  - Passwords in config files
- [ ] Scan file contents during parsing
- [ ] Configurable action: warn, redact, or fail
- [ ] Log detected secrets (redacted) for audit
- [ ] Add ENABLE_SECRET_SCANNING environment variable

### Task 4: Create configuration schema
- [ ] Create config.ts with all configuration values
- [ ] Use Zod to define configuration schema
- [ ] Load values from environment variables
- [ ] Provide sensible defaults
- [ ] Validate configuration on startup
- [ ] Export type-safe configuration object

### Task 5: Document environment variables
- [ ] Create .env.example with all variables
- [ ] Document each variable (purpose, type, default)
- [ ] Separate required vs optional variables
- [ ] Add environment-specific examples (.env.development, .env.production)
- [ ] Update README with configuration section
- [ ] Document port configuration (use PORT-CONFIGURATION.md)

### Task 6: Add memory management
- [ ] Monitor memory usage during large repository parsing
- [ ] Implement streaming for large files (if needed)
- [ ] Add memory limit checks
- [ ] Optimize memory usage in parser
- [ ] Document memory requirements for different repo sizes

### Task 7: Security hardening
- [ ] Validate repository URLs (prevent SSRF)
- [ ] Sanitize file paths (prevent path traversal)
- [ ] Limit network access (if cloning from arbitrary URLs)
- [ ] Rate limiting on upload endpoints (prevent abuse)
- [ ] Add request validation for all inputs

---

## Dev Notes

### File Storage Strategy

**Temporary File Location:**
```typescript
const TEMP_DIR = process.env.PARSER_TEMP_DIR || os.tmpdir();
const STORAGE_PATH = path.join(TEMP_DIR, 'diagram-builder');
```

**Cleanup Strategy:**

**Option 1: Immediate Cleanup (Recommended for MVP)**
- Delete files immediately after parsing completes
- Pro: No storage accumulation
- Con: Can't debug failed parses

**Option 2: Retention Policy**
- Keep files for configurable duration (e.g., 24 hours)
- Background job cleans up old files
- Pro: Can debug issues, re-parse without re-download
- Con: Requires storage management

**Option 3: Keep Until Workspace Deleted**
- Keep parsed files until user deletes workspace
- Allows re-parsing, debugging
- Pro: Maximum flexibility
- Con: Highest storage usage

**Recommendation:** Start with Option 1, add Option 2 later if needed

### Repository Size Limits

**Why Size Limits Matter:**
- Prevent DoS attacks (malicious 10GB repo upload)
- Prevent out-of-memory errors
- Ensure reasonable parsing times
- Protect shared infrastructure

**Recommended Defaults:**
```typescript
const config = {
  MAX_REPO_SIZE_MB: 500,      // 500MB max repository
  MAX_FILE_COUNT: 10_000,     // 10k files max
  MAX_FILE_SIZE_MB: 10,       // 10MB per file
  PARSE_TIMEOUT_MS: 300_000,  // 5 minute timeout
};
```

**Size Check Implementation:**
```typescript
// Before cloning Git repo
const repoSize = await getGitRepoSize(repoUrl); // GitHub API
if (repoSize > config.MAX_REPO_SIZE_MB * 1024 * 1024) {
  throw new Error(`Repository too large: ${repoSize}MB exceeds limit of ${config.MAX_REPO_SIZE_MB}MB`);
}

// During file discovery
if (files.length > config.MAX_FILE_COUNT) {
  throw new Error(`Too many files: ${files.length} exceeds limit of ${config.MAX_FILE_COUNT}`);
}

// Before reading individual file
const fileSize = fs.statSync(filePath).size;
if (fileSize > config.MAX_FILE_SIZE_MB * 1024 * 1024) {
  logger.warn(`Skipping large file: ${filePath} (${fileSize}MB)`);
  continue;
}
```

### Secret Scanning

**Why Secret Scanning Matters:**
- Users may accidentally upload repos with secrets
- Could expose credentials in Neo4j, logs, or UI
- Security best practice for code analysis tools

**Secret Patterns to Detect:**
```typescript
const secretPatterns = [
  // AWS
  /AKIA[0-9A-Z]{16}/,           // AWS Access Key ID
  /[0-9a-zA-Z/+=]{40}/,         // AWS Secret Access Key

  // GitHub
  /ghp_[a-zA-Z0-9]{36}/,        // GitHub Personal Access Token
  /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/,  // GitHub Fine-grained PAT

  // Generic
  /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,  // Private keys
  /(password|passwd|pwd)[\s]*[:=][\s]*[^\s]+/i,       // Passwords in configs
  /(api[_-]?key|apikey|access[_-]?token)[\s]*[:=][\s]*[^\s]+/i,  // API keys
];
```

**Action Options:**
```typescript
enum SecretAction {
  WARN = 'warn',    // Log warning, continue parsing
  REDACT = 'redact',  // Replace secret with '[REDACTED]'
  FAIL = 'fail',    // Abort parsing, return error
}

const SECRET_ACTION = process.env.SECRET_ACTION || SecretAction.WARN;
```

**Recommendation:** Use WARN for MVP, REDACT for production

### Environment Configuration

**Configuration Schema (Zod):**
```typescript
import { z } from 'zod';

const ConfigSchema = z.object({
  // Server
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Database
  NEO4J_URI: z.string().url(),
  NEO4J_USER: z.string(),
  NEO4J_PASSWORD: z.string(),
  REDIS_URL: z.string().url(),

  // Parser
  PARSER_TEMP_DIR: z.string().optional(),
  MAX_REPO_SIZE_MB: z.coerce.number().default(500),
  MAX_FILE_COUNT: z.coerce.number().default(10000),
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  PARSE_TIMEOUT_MS: z.coerce.number().default(300000),
  ENABLE_SECRET_SCANNING: z.coerce.boolean().default(true),
  SECRET_ACTION: z.enum(['warn', 'redact', 'fail']).default('warn'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  const parsed = ConfigSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid configuration:', parsed.error);
    process.exit(1);
  }
  return parsed.data;
}
```

**.env.example:**
```bash
# Server Configuration
PORT=4000
NODE_ENV=development

# Database Configuration (Required)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
REDIS_URL=redis://localhost:6379

# Parser Configuration (Optional - defaults shown)
PARSER_TEMP_DIR=/tmp/diagram-builder
MAX_REPO_SIZE_MB=500
MAX_FILE_COUNT=10000
MAX_FILE_SIZE_MB=10
PARSE_TIMEOUT_MS=300000

# Security Configuration (Optional - defaults shown)
ENABLE_SECRET_SCANNING=true
SECRET_ACTION=warn

# Logging Configuration (Optional - defaults shown)
LOG_LEVEL=info
```

### Security Considerations

**URL Validation (Prevent SSRF):**
```typescript
function isValidRepoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow public Git hosts
    const allowedHosts = [
      'github.com',
      'gitlab.com',
      'bitbucket.org',
    ];

    if (!allowedHosts.includes(parsed.hostname)) {
      throw new Error('Repository must be from allowed hosts');
    }

    // No local/private IPs
    if (parsed.hostname === 'localhost' ||
        parsed.hostname.startsWith('127.') ||
        parsed.hostname.startsWith('192.168.')) {
      throw new Error('Cannot access local repositories');
    }

    return true;
  } catch (err) {
    return false;
  }
}
```

**Path Validation (Prevent Path Traversal):**
```typescript
function isValidLocalPath(inputPath: string): boolean {
  const resolved = path.resolve(inputPath);
  const baseDir = path.resolve(config.PARSER_TEMP_DIR);

  // Ensure path stays within temp directory
  if (!resolved.startsWith(baseDir)) {
    throw new Error('Path traversal detected');
  }

  return true;
}
```

### Files Involved

**Parser Package:**
- `packages/parser/src/config.ts` (create - configuration schema)
- `packages/parser/src/security/secret-scanner.ts` (create)
- `packages/parser/src/storage/file-manager.ts` (create)
- `packages/parser/src/storage/cleanup.ts` (create)
- `packages/parser/src/validation/size-validator.ts` (create)

**API Package:**
- `packages/api/src/config.ts` (create - configuration schema)
- `packages/api/src/middleware/rate-limiter.ts` (create)
- `packages/api/src/validation/url-validator.ts` (create)

**Configuration:**
- `.env.example` (create)
- `.env.development` (create)
- `.env.production.example` (create)
- `README.md` (update - add configuration section)

### Dependencies

- **Depends On:** Story 6-1 (parser must work for config to matter)
- **Integrates With:** Story 6-2 (logging uses config)
- **Enables:** Production deployment, security compliance

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 8-10 hours
- **Priority:** MEDIUM - Operational readiness

---

## Dev Agent Record

*Implementation notes will be added here during development*

---

## File List

*Modified/created files will be listed here after implementation*

---

## Change Log

- **2026-01-04**: Story created from Epic 6 planning
  - Brainstorming session identified 10+ configuration/security questions
  - Operational stability requires file management and size limits
  - Security requires secret scanning and input validation
  - Production readiness requires comprehensive configuration

**Status:** backlog
**Created:** 2026-01-04
**Last Updated:** 2026-01-04
