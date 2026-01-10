# opencode-knowledge

A comprehensive knowledge management system for OpenCode that provides:
- **Role-based AI personalities** - Customize OpenCode's communication style
- **Knowledge vault** - Organize coding standards, patterns, and best practices
- **Tag-based search** - Quickly find relevant knowledge packages
- **Session management** - Track loaded packages and optimize token usage

## Features

### 🎭 Personality System
Choose from different AI personas (staff engineer, frontend specialist, cthulhu, etc.) that influence how OpenCode communicates and approaches problems.

### 📚 Knowledge Vault
Create a structured library of markdown-based knowledge packages with frontmatter metadata for easy discovery and loading.

### 🔍 Smart Search
Tag-based search system finds relevant knowledge packages based on your current task.

### 💾 Session Persistence
Tracks loaded packages across sessions and provides token-optimized context injection.

---

## Installation

Add the plugin to your OpenCode config:

**Global config** (`~/.config/opencode/opencode.json` or `opencode.jsonc`):

```json
{
  "plugin": ["opencode-knowledge"]
}
```

**Or per-project** (`opencode.json` or `opencode.jsonc` in your project root):

```json
{
  "plugin": ["opencode-knowledge"]
}
```

---

## Quick Start

### 1. Create Settings File

Create `.opencode/knowledge/settings.json` in your project:

```json
{
  "role": "staff_engineer"
}
```

### 2. Create Knowledge Vault (Optional)

If you want to use the knowledge management features, create a vault structure:

```bash
mkdir -p .opencode/knowledge/vault/standards
```

### 3. Create Your First Knowledge Package

Create `.opencode/knowledge/vault/standards/code-conventions.md`:

```markdown
---
tags:
  - standards
  - typescript
  - conventions
description: Core code conventions and style guide
category: standards
---

# Code Conventions

## Naming
- Use camelCase for variables and functions
- Use PascalCase for classes and types

## Formatting
- Use single quotes for strings
- Line width: 100 characters
- Always use semicolons
```

### 4. Start OpenCode Session

The knowledge catalog is **automatically built on session start**. Just start a new session and the plugin will:
- Scan your vault for packages
- Build the searchable catalog
- Inject knowledge map on first message

### 5. Search and Load Knowledge

Search for packages by tags:

```
knowledge_search [tags=typescript,conventions]
```

Load packages into your session:

```
knowledge_load [paths=standards/code-conventions.md]
```

---

## Available Personalities

### staff_engineer

Skeptical, pragmatic Staff Engineer focused on architecture, coupling, operational risk, and maintainability.

**Best for**: Code reviews, architecture decisions, production systems

### cthulhu

Ancient cosmic entity providing technical guidance with existential dread and cosmic perspective.

**Best for**: When you need technical help but also want to contemplate the meaninglessness of time

---

## Tools

### knowledge_search

Search for knowledge packages by tags.

```
knowledge_search [tags=typescript,react,testing]
```

**Parameters**: Comma-separated list of tags

**Output**: Ranked list of matching packages with relevance scores

**Example**:
```
Found 5 packages matching [typescript, react]:

- **frontend/react-patterns.md** (75%)
  Tags: typescript, react, patterns
  Common React patterns and best practices

- **standards/typescript-conventions.md** (50%)
  Tags: typescript, conventions
  TypeScript coding standards
```

---

### knowledge_load

Load knowledge packages into the current session.

```
knowledge_load [paths=standards/code-conventions.md,frontend/react-patterns.md]
```

**Parameters**: Comma-separated list of package paths (relative to vault/)

**Output**: Package content injected into context

**Features**:
- Deduplication (won't load same package twice)
- Session tracking (remembers what's loaded)
- Error handling (warns about missing packages)

---

### knowledge_index

Manually rebuild the knowledge catalog from your vault.

```
knowledge_index
```

**Output**: Summary of categories and packages indexed.

**Note**: The catalog is **automatically built on session start**, so you rarely need this tool.

**When to use**:
- After adding packages mid-session
- If auto-build failed during session start
- To verify catalog contents

---

## Knowledge Package Format

Knowledge packages are markdown files with YAML frontmatter:

```markdown
---
tags:
  - tag1
  - tag2
  - tag3
description: Brief description of this package
category: category-name
required_knowledge:
  - other-package-1
  - other-package-2
file_patterns:
  - "*.tsx"
  - "*.test.ts"
---

# Package Title

Your knowledge content here...
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `tags` | Yes | Array of searchable tags |
| `description` | Yes | Brief summary (used in search results) |
| `category` | Yes | Category for organization (e.g., `frontend`, `backend`, `standards`) |
| `required_knowledge` | No | Other packages that should be loaded first |
| `file_patterns` | No | File patterns where this knowledge applies |

---

## Directory Structure

```
your-project/
└── .opencode/
    └── knowledge/
        ├── settings.json              # Plugin configuration
        ├── knowledge.json             # Auto-generated catalog (gitignored)
        ├── vault/                     # Your knowledge packages
        │   ├── frontend/
        │   │   ├── react-patterns.md
        │   │   └── state-management.md
        │   ├── backend/
        │   │   └── api-design.md
        │   └── standards/
        │       ├── code-conventions.md
        │       └── testing-guide.md
        └── tracker/                   # Session state (gitignored)
            ├── session-state.jsonl
            └── knowledge-reads.jsonl
```

---

## Token Optimization

The plugin uses a single-phase approach for optimal token usage:

### First Message Only
- Shows full category-tag map (~500-1000 tokens depending on vault size)
- Injects personality
- Documents available tools with examples
- Creates session state

### Subsequent Messages
- No knowledge context injected
- LLM uses memory of first message
- **100% token savings** on subsequent messages

This approach provides significant token savings while ensuring the LLM has all the context it needs from the initial session setup.

---

## Example Vault Structure

Here's a recommended organization pattern:

```
vault/
├── frontend/
│   ├── react-patterns.md          # React best practices
│   ├── state-management.md        # Redux, Context, etc.
│   ├── component-testing.md       # Testing components
│   └── accessibility.md           # A11y guidelines
├── backend/
│   ├── api-design.md              # REST/GraphQL patterns
│   ├── database-patterns.md       # ORM, migrations
│   └── error-handling.md          # Error handling strategies
├── standards/
│   ├── code-conventions.md        # General coding standards
│   ├── git-workflow.md            # Branch strategy, commits
│   └── code-review.md             # Review guidelines
└── infrastructure/
    ├── docker-patterns.md         # Container best practices
    ├── ci-cd.md                   # Pipeline patterns
    └── monitoring.md              # Observability
```

---

## Advanced Usage

### Creating Cross-Referenced Packages

Use `required_knowledge` to create dependency chains:

```markdown
---
tags:
  - react
  - advanced
  - performance
description: Advanced React performance optimization
category: frontend
required_knowledge:
  - frontend/react-patterns
  - standards/code-conventions
---

# Advanced React Performance

This builds on basic patterns...
```

### File Pattern Targeting

Specify when knowledge applies:

```markdown
---
tags:
  - testing
  - jest
description: Jest testing patterns
category: frontend
file_patterns:
  - "*.test.ts"
  - "*.test.tsx"
  - "*.spec.ts"
---

# Jest Testing Guide
```

---

## Troubleshooting

### Settings file not found

**Error**: `CONFIGURATION ERROR: Settings file not found`

**Solution**: Create `.opencode/knowledge/settings.json` with:
```json
{
  "role": "staff_engineer"
}
```

### Personality not loading

**Error**: `CONFIGURATION ERROR: Personality file not found`

**Solution**: Verify the role name in `settings.json` matches an available personality (`staff_engineer` or `cthulhu`)

### Catalog not found

**Error**: `Knowledge catalog not found. Run knowledge_index first.`

**Solution**: Run `knowledge_index` to build the catalog from your vault

### Search returns no results

**Possible causes**:
1. Catalog is outdated → Run `knowledge_index`
2. Tags don't match → Check tag spelling
3. No packages with those tags → Add packages or adjust search

---

## Development

### Building

```bash
mise run build
```

Or directly with Bun:

```bash
bun build ./src/index.ts --outdir dist --target bun
```

### Linting

```bash
mise run lint       # Check for issues
mise run lint:fix   # Auto-fix issues
```

### Formatting

```bash
mise run format
```

---

## Roadmap

- [ ] Auto-load packages based on file patterns
- [ ] Knowledge package dependencies resolution
- [ ] Usage analytics and metrics
- [ ] Export/import vault bundles
- [ ] Knowledge package templates
- [ ] VSCode extension for vault management

---

## Contributing

Contributions welcome! Please:

1. Follow the code conventions in `AGENTS.md`
2. Run `mise run lint` before committing
3. Update documentation for new features
4. Add tests for new functionality

---

## License

MIT License. See the [LICENSE](LICENSE) file for details.
