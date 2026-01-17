# opencode-knowledge <img src="./assets/opencode-knowledge-logo.png" align="right" height="100"/>

An OpenCode plugin that dynamically loads knowledge from your vault on-demand. Add any content you want, the AI figures out what to load using tags and descriptions.

## Features

### 📚 Knowledge Vault

Organize coding standards, patterns, and best practices in markdown files with frontmatter metadata.

### 🔍 Smart Search

Tag-based search finds relevant packages. The AI uses tags and descriptions to discover the right context.

### 💾 Session Persistence

Automatically indexes your vault on session start and tracks loaded packages.

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

### 1. Create Knowledge Vault

Create the vault directory structure:

```bash
mkdir -p .opencode/knowledge/vault/standards
```

### 2. Create Your First Knowledge Package

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

### 3. Start OpenCode Session

The knowledge catalog is **automatically built on session start**. Just start a new session and the plugin will:

- Scan your vault for packages
- Build the searchable catalog
- Inject knowledge map on first message

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
  - '*.tsx'
  - '*.test.ts'
---

# Package Title

Your knowledge content here...
```

### Frontmatter Fields

| Field                | Required | Description                                                                                          |
| -------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `tags`               | Yes      | Array of searchable tags                                                                             |
| `description`        | Yes      | Brief summary (used in search results)                                                               |
| `category`           | Yes      | Category for organization (e.g., `frontend`, `backend`, `standards`)                                 |
| `required_knowledge` | No       | Other packages that should be loaded automatically before this one (supports recursive dependencies) |
| `file_patterns`      | No       | File patterns where this knowledge applies (not yet implemented)                                     |

### Dependency Loading

The `required_knowledge` field enables automatic dependency loading. When you load a package, the plugin automatically loads all its dependencies first, recursively.

**Example:**

```markdown
## <!-- vault/personal/blog-writing.md -->

tags: [blog, writing]
description: Blog writing guidelines
category: personal
required_knowledge:

- personal/author-context

---
```

When AI loads `personal/blog-writing.md`, the plugin:

1. Detects the `required_knowledge` dependency
2. Automatically loads `personal/author-context.md` first
3. Then loads `personal/blog-writing.md`

This ensures the AI always has complete context without manual tracking. Dependencies can be nested (Package A requires B, B requires C), and the plugin handles circular dependencies gracefully.

---

## Directory Structure

```
your-project/
└── .opencode/
    └── knowledge/
        ├── knowledge.json
        ├── vault/
        │   ├── frontend/
        │   │   ├── react-patterns.md
        │   │   └── state-management.md
        │   ├── backend/
        │   │   └── api-design.md
        │   └── standards/
        │       ├── code-conventions.md
        │       └── testing-guide.md
        └── tracker/
            ├── session-state.jsonl
            └── knowledge-reads.jsonl
```

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

## Contributing

Contributions welcome! Please:

1. Follow the code conventions in `AGENTS.md`
2. Run `mise run lint` before committing
3. Update documentation for new features
4. Add tests for new functionality

---

## Credits

Special thanks to [@canyavall](https://github.com/canyavall) for being the creative mind that came up with the idea and initial working solution. He continues to improve this in the shadows to this day.

---

## License

MIT License. See the [LICENSE](LICENSE) file for details.
