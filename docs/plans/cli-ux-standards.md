# CLI UX Standards - Diagram Builder

**Document Version:** 1.0  
**Created:** 2026-01-02  
**Purpose:** Define CLI output format, error messaging, help text, and export consistency standards for Epic 6 CLI implementation

---

## 📋 Overview

This document establishes UX standards for the Diagram Builder CLI tool to ensure:
- Consistent, predictable output formatting
- User-friendly error messages that guide users to solutions
- Clear, comprehensive help documentation
- Export format consistency with the web UI

---

## 🖥️ CLI Output Format Standards

### Table Output

Use ASCII box-drawing characters for tabular data. Tables should be clean, aligned, and easy to read.

**Standard Table Format:**
```
┌─────────────────────────┬──────────┬──────────┬─────────────────────┐
│ Workspace               │ Files    │ Status   │ Last Updated        │
├─────────────────────────┼──────────┼──────────┼─────────────────────┤
│ default-workspace       │ 1,234    │ Active   │ 2026-01-02 10:30    │
│ multi-repo-workspace    │ 5,678    │ Active   │ 2026-01-01 15:45    │
│ demo-project           │ 456      │ Archived │ 2025-12-28 09:15    │
└─────────────────────────┴──────────┴──────────┴─────────────────────┘
```

**Guidelines:**
- Use Unicode box-drawing characters: `┌─┬─┐├─┼─┤└─┴─┘│`
- Left-align text columns
- Right-align numeric columns
- Add thousands separators for large numbers (1,234 not 1234)
- Truncate long text with ellipsis if needed (max column width)
- Always include header row with column names

**Library:** Use `cli-table3` npm package for consistent table rendering

---

### JSON Output

When users specify `--json` or `--format json`, output structured JSON that can be piped to other tools.

**Standard JSON Structure:**
```json
{
  "success": true,
  "data": {
    // Command-specific data here
  },
  "meta": {
    "timestamp": "2026-01-02T12:00:00Z",
    "version": "1.0.0",
    "command": "diagram-builder parse",
    "executionTime": 1234
  }
}
```

**Error JSON Structure:**
```json
{
  "success": false,
  "error": {
    "code": "E1001",
    "message": "Failed to parse repository",
    "details": "Invalid JavaScript syntax in src/components/broken.js:42:15",
    "suggestions": [
      "Fix the syntax error in the file",
      "Exclude the file using --exclude flag",
      "Run with --skip-errors to continue parsing"
    ]
  },
  "meta": {
    "timestamp": "2026-01-02T12:00:00Z",
    "version": "1.0.0",
    "command": "diagram-builder parse ./project"
  }
}
```

**Guidelines:**
- Always include `success` boolean at root level
- Use ISO 8601 timestamps (`YYYY-MM-DDTHH:mm:ssZ`)
- Include semantic version in meta
- Keep data structure flat when possible
- Use camelCase for property names
- Include execution time in milliseconds
- Never output partial JSON (ensure it's valid)

---

### Progress Indicators

For long-running operations, show progress with spinners and status updates.

**Spinner with Progress:**
```
⠋ Parsing codebase... (234/1000 files)
```

**Spinner Frames (rotating):**
```
⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏
```

**Completion Messages:**
```
✓ Parsing complete (1000 files in 45s)
✓ Export saved to diagram.png
✓ Repository cloned successfully
```

**Progress Bar (for downloads/clones):**
```
Cloning repository...
[████████████████░░░░] 80% (8.2 MB/10 MB)
```

**Guidelines:**
- Use spinner for indeterminate progress
- Show file count when available (`234/1000 files`)
- Use checkmark (✓) for success
- Include timing info on completion (`in 45s`)
- Update on same line (carriage return `\r`)
- Clear spinner/progress before final message
- Use `ora` npm package for spinners

---

### Color Conventions

Use colors to convey meaning and improve scannability. Colors should work on both light and dark terminal themes.

**Color Scheme:**

| Color | Usage | Example |
|-------|-------|---------|
| 🟢 **Green** | Success, completion | `✓ Export complete` |
| 🟡 **Yellow** | Warnings, non-critical issues | `⚠ 3 files skipped` |
| 🔴 **Red** | Errors, failures | `✗ Parsing failed` |
| 🔵 **Blue** | Info, highlights | `ℹ Using workspace: default` |
| ⚪ **Gray/Dim** | Secondary info, timestamps | `Last updated: 2 hours ago` |
| **Bold** | Emphasis, headers | `Workspace Management` |

**Examples:**
```bash
# Success
✓ Repository parsed successfully

# Warning
⚠ Warning: 5 files contained syntax errors and were skipped

# Error
✗ Error: Failed to connect to Neo4j database

# Info
ℹ Using default workspace: default-workspace

# Multiple colors in one line
✓ Parsed 1,234 files (⚠ 5 warnings, ✗ 2 errors)
```

**Guidelines:**
- Use ANSI color codes via `chalk` npm package
- Test on both light and dark terminal backgrounds
- Always provide text symbols alongside colors (✓, ✗, ⚠, ℹ)
- Respect `NO_COLOR` environment variable
- Respect `--no-color` flag to disable colors
- Never use color as the only indicator (accessibility)

---

## ❌ Error Message Patterns

### Error Message Structure

Every error should follow this structure for consistency and helpfulness:

```
✗ ERROR: <Short user-facing description>

<Detailed explanation of what went wrong>

Suggestions:
  • <Actionable suggestion 1>
  • <Actionable suggestion 2>
  • <Actionable suggestion 3>

Error Code: E<code>

For more help: diagram-builder <command> --help
```

### Error Categories and Codes

| Code Range | Category | Examples |
|------------|----------|----------|
| E1000-E1099 | Parsing errors | Syntax errors, unsupported files |
| E2000-E2099 | Database errors | Connection failures, query errors |
| E3000-E3099 | Export errors | Write failures, format errors |
| E4000-E4099 | Authentication errors | Token errors, permission denied |
| E5000-E5099 | Network errors | Clone failures, API timeouts |
| E6000-E6099 | Validation errors | Invalid arguments, missing files |

### Error Examples

**Parsing Error:**
```bash
✗ ERROR: Failed to parse repository

The parser encountered invalid JavaScript syntax in file:
  src/components/broken.js:42:15
  
  Unexpected token '}' - missing closing parenthesis

Suggestions:
  • Fix the syntax error in src/components/broken.js at line 42
  • Exclude the file using: --exclude "**/broken.js"
  • Continue parsing other files with: --skip-errors

Error Code: E1001

For more help: diagram-builder parse --help
```

**Database Connection Error:**
```bash
✗ ERROR: Cannot connect to Neo4j database

Failed to establish connection to Neo4j at bolt://localhost:7687
Connection refused - is the database running?

Suggestions:
  • Start Neo4j with: docker compose up -d
  • Check database status with: docker compose ps
  • Verify connection settings in .env file
  • Check if port 7687 is blocked by firewall

Error Code: E2001

For more help: https://docs.diagram-builder.io/troubleshooting/database
```

**File Not Found Error:**
```bash
✗ ERROR: Path not found

The specified path does not exist:
  /Users/brian/projects/nonexistent

Suggestions:
  • Check the path spelling and try again
  • Use absolute path: /full/path/to/project
  • For Git repositories, use full URL: https://github.com/user/repo.git

Error Code: E6001

For more help: diagram-builder parse --help
```

### Error Message Guidelines

**Do:**
- ✅ Start with what went wrong from user's perspective
- ✅ Explain the technical reason in simple terms
- ✅ Provide 2-4 actionable suggestions
- ✅ Include error code for documentation lookup
- ✅ Show file paths and line numbers when relevant
- ✅ Link to help documentation
- ✅ Use consistent formatting

**Don't:**
- ❌ Show stack traces to users (log them instead)
- ❌ Use technical jargon without explanation
- ❌ Say "Something went wrong" without details
- ❌ Blame the user ("You entered invalid input")
- ❌ Provide suggestions that don't help

---

## 📖 Help Text Structure

### Command Help Format

Every command's `--help` output should follow this structure:

```
diagram-builder <command> - <Brief one-line description>

USAGE:
  diagram-builder <command> [OPTIONS] <required-arg> [optional-arg]

ARGUMENTS:
  <required-arg>    Description of required argument
  [optional-arg]    Description of optional argument

OPTIONS:
  --option <value>    Description of option (default: value)
  --flag              Description of boolean flag

FLAGS:
  -h, --help          Show this help message
  -v, --version       Show version information
  --json              Output as JSON
  --no-color          Disable colored output
  --verbose           Show detailed output
  --quiet             Suppress non-error output

EXAMPLES:
  <Example 1 with description>:
    $ diagram-builder <command> example1

  <Example 2 with description>:
    $ diagram-builder <command> example2 --option value

  <Example 3 with description>:
    $ diagram-builder <command> example3 --flag

ENVIRONMENT VARIABLES:
  API_URL             API server URL (default: http://localhost:4000)
  NEO4J_URI           Neo4j connection URI (default: bolt://localhost:7687)
  JWT_TOKEN           Authentication token for API

For more information: https://docs.diagram-builder.io/cli/<command>
```

### Top-Level Help

```
diagram-builder - 3D codebase visualization and export tool

VERSION:
  1.0.0

USAGE:
  diagram-builder <command> [OPTIONS]

COMMANDS:
  parse       Parse a codebase and store in database
  export      Export visualization to file (PlantUML, Mermaid, etc.)
  workspace   Manage workspaces
  viewpoint   Manage viewpoints
  list        List parsed repositories
  status      Show parsing status
  version     Show version information

GLOBAL OPTIONS:
  -h, --help          Show this help message
  -v, --version       Show version information
  --json              Output as JSON
  --no-color          Disable colored output
  --verbose           Show detailed output
  --quiet             Suppress non-error output

EXAMPLES:
  Get help for a specific command:
    $ diagram-builder parse --help

  Parse a local codebase:
    $ diagram-builder parse ./my-project --workspace default

  Export to PlantUML:
    $ diagram-builder export --format plantuml --output diagram.puml

  List all workspaces:
    $ diagram-builder workspace list

For more information: https://docs.diagram-builder.io/cli
```

### Help Text Guidelines

**Do:**
- ✅ Keep description to one sentence
- ✅ Use consistent formatting across all commands
- ✅ Provide 2-3 real-world examples
- ✅ Document all options and flags
- ✅ Show default values for options
- ✅ Link to online documentation
- ✅ Group related options together
- ✅ Use angle brackets for required args: `<path>`
- ✅ Use square brackets for optional args: `[branch]`

**Don't:**
- ❌ Write paragraphs - keep it scannable
- ❌ Use technical jargon without explanation
- ❌ Omit default values
- ❌ Forget to document environment variables
- ❌ Show examples that won't work

---

## 📤 Export Format Consistency

The CLI must produce exports that are **identical** to web UI exports for consistency.

### Supported Export Formats

All formats supported by the UI must be available in CLI:

| Format | Extension | CLI Flag | UI Equivalent |
|--------|-----------|----------|---------------|
| PlantUML | `.puml` | `--format plantuml` | Export → PlantUML |
| Mermaid | `.mmd` | `--format mermaid` | Export → Mermaid |
| Draw.io | `.drawio` | `--format drawio` | Export → Draw.io |
| GLTF | `.gltf` | `--format gltf` | Export → 3D Model |
| PNG | `.png` | `--format png` | Export → Image (PNG) |
| SVG | `.svg` | `--format svg` | Export → Image (SVG) |

### LOD Level Mapping

LOD (Level of Detail) must match UI exactly:

| Level | Description | CLI Flag | UI Setting |
|-------|-------------|----------|------------|
| 1 | High-level architecture (repositories, major modules) | `--lod 1` | LOD: Low |
| 2 | Module/package level (files, directories) | `--lod 2` | LOD: Medium (default) |
| 3 | Class/function level (detailed structure) | `--lod 3` | LOD: High |
| 4 | Maximum detail (all nodes and edges) | `--lod 4` | LOD: Maximum |

### Export Quality Requirements

**PNG/SVG Images:**
- Default resolution: 1920x1080 (same as UI)
- Configurable via `--width` and `--height`
- Same DPI as UI exports (72 DPI default)
- Transparent background option: `--transparent`
- Same color scheme as UI (configurable theme)

**GLTF 3D Models:**
- Same 3D structure as UI visualization
- Same node positioning algorithm
- Same edge rendering
- Include metadata in extras field
- Optimized for web viewing

**Diagram Formats (PlantUML, Mermaid, Draw.io):**
- Same styling and color scheme as UI
- Same arrow styles and directions
- Same node shapes and labels
- Proper escaping of special characters
- Valid, parsable output

**Metadata (all formats):**
- Include export timestamp
- Include LOD level used
- Include source repository info
- Include tool version
- Include filter/viewpoint info (if applicable)

### Export Command Examples

```bash
# Export to PlantUML (default LOD 2)
$ diagram-builder export --workspace default --format plantuml --output diagram.puml

# Export to PNG with custom resolution
$ diagram-builder export --workspace default --format png --output diagram.png --width 3840 --height 2160

# Export to Mermaid with LOD 1 (high-level)
$ diagram-builder export --workspace default --format mermaid --lod 1 --output architecture.mmd

# Export specific viewpoint
$ diagram-builder export --viewpoint auth-flow --format png --output auth-flow.png

# Export all formats at once
$ diagram-builder export --workspace default --all-formats --output-dir ./exports
```

### Export Consistency Checklist

Before Epic 6 CLI implementation:

- [ ] Review UI export code for each format
- [ ] Extract shared export logic to `@diagram-builder/core`
- [ ] CLI uses same export functions as UI
- [ ] Test exports side-by-side (CLI vs UI)
- [ ] Verify file sizes are similar
- [ ] Verify visual appearance matches
- [ ] Document any differences (if unavoidable)

---

## 🎨 Visual Design Guidelines

### Command Output Hierarchy

Use visual hierarchy to make output scannable:

**Level 1 - Command Title:**
```bash
═══════════════════════════════════════════════
  WORKSPACE MANAGEMENT
═══════════════════════════════════════════════
```

**Level 2 - Section Headers:**
```bash
Active Workspaces:
```

**Level 3 - Data/Content:**
```bash
  default-workspace (1,234 files)
```

**Level 4 - Metadata/Details:**
```bash
  Last updated: 2 hours ago
```

### Consistent Symbols

Use these symbols consistently across all commands:

| Symbol | Meaning | Usage |
|--------|---------|-------|
| ✓ | Success | Operation completed |
| ✗ | Error | Operation failed |
| ⚠ | Warning | Non-critical issue |
| ℹ | Info | Informational message |
| → | Direction | "Goes to", "Results in" |
| • | List item | Bullet points |
| ├── | Tree branch | Hierarchical structure |
| └── | Tree end | Last item in hierarchy |

---

## 🧪 Testing CLI UX

### Manual Testing Checklist

For each command:

- [ ] Test `--help` output is clear and complete
- [ ] Test with valid inputs (success path)
- [ ] Test with invalid inputs (error paths)
- [ ] Test with missing required arguments
- [ ] Test with `--json` flag
- [ ] Test with `--no-color` flag
- [ ] Test progress indicators don't flicker
- [ ] Test table formatting with various data sizes
- [ ] Test on light and dark terminal themes
- [ ] Test on different terminal widths (80, 120, 160 columns)

### Automated Testing

```typescript
// Example test structure
describe('CLI Output', () => {
  it('should format table output correctly', () => {
    const output = runCommand('workspace list')
    expect(output).toContain('┌')
    expect(output).toMatch(/│.*│/)
    expect(output).toContain('└')
  })

  it('should output valid JSON with --json flag', () => {
    const output = runCommand('workspace list --json')
    const json = JSON.parse(output)
    expect(json.success).toBe(true)
    expect(json.data).toBeDefined()
  })

  it('should show helpful error message on failure', () => {
    const output = runCommand('parse /nonexistent')
    expect(output).toContain('ERROR')
    expect(output).toContain('Suggestions:')
    expect(output).toContain('Error Code:')
  })
})
```

---

## 📚 Reference Implementations

### Excellent CLI UX Examples

These tools have excellent CLI UX that we should emulate:

- **npm** - Clear error messages, helpful suggestions
- **git** - Consistent command structure, excellent help text
- **docker** - Good table formatting, progress indicators
- **vercel** - Beautiful spinners, color usage
- **prisma** - Interactive prompts, clear output

### NPM Packages to Use

- **chalk** - Terminal colors (https://npmjs.com/package/chalk)
- **cli-table3** - ASCII tables (https://npmjs.com/package/cli-table3)
- **ora** - Spinners (https://npmjs.com/package/ora)
- **commander** - CLI framework (https://npmjs.com/package/commander)
- **inquirer** - Interactive prompts (https://npmjs.com/package/inquirer)

---

## ✅ Implementation Checklist

When implementing Epic 6 CLI:

**Setup Phase:**
- [ ] Install recommended npm packages
- [ ] Set up commander.js command structure
- [ ] Create shared output formatting utilities
- [ ] Set up error handling with error codes

**For Each Command:**
- [ ] Implement table output
- [ ] Implement JSON output (`--json` flag)
- [ ] Add progress indicators for long operations
- [ ] Write comprehensive help text
- [ ] Add 2-3 usage examples
- [ ] Implement error handling with suggestions
- [ ] Add color coding (respecting `--no-color`)
- [ ] Test on light and dark terminals

**Export Commands:**
- [ ] Use shared export logic from `@diagram-builder/core`
- [ ] Support all formats UI supports
- [ ] Implement LOD level selection
- [ ] Add resolution options for images
- [ ] Test exports match UI exports
- [ ] Document any format-specific options

**Quality Assurance:**
- [ ] Run manual testing checklist
- [ ] Write automated tests for output formatting
- [ ] Test all error paths
- [ ] Verify help text completeness
- [ ] Check accessibility (works without color)
- [ ] Test on different terminal sizes

---

## 📖 Documentation Links

After CLI implementation, update these docs:

- CLI User Guide: `docs/cli-guide.md`
- CLI Reference: `docs/cli-reference.md`
- Error Codes: `docs/error-codes.md`
- Environment Variables: `docs/environment.md`

---

**Document Status:** ✅ Complete  
**Next Steps:** Use this as reference during Epic 6 CLI implementation  
**Questions?** Review with team before implementation begins
