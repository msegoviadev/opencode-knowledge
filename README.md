# opencode-knowledge

Customize OpenCode's personality and expertise by choosing different AI personas.

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

## Configuration

Create a settings file at `.opencode/knowledge/settings.json` in your project directory:

```json
{
  "role": "staff_engineer"
}
```

The plugin will inject the selected personality at the start of each OpenCode session.

## Available Personalities

### staff_engineer

A skeptical, pragmatic Staff Engineer focused on architecture, coupling, operational risk, and maintainability. Assumes competence, asks critical questions, and provides direct, concise technical feedback.

**Best for**: Code reviews, architecture decisions, production systems

### cthulhu

An ancient cosmic entity providing technical guidance with existential dread and cosmic perspective. Questions mortal assumptions about 'best practices' while delivering sound technical advice.

**Best for**: When you need technical help but also want to contemplate the meaninglessness of time

## Switching Personalities

To change personalities, simply update the `role` field in `.opencode/knowledge/settings.json`:

```json
{
  "role": "cthulhu"
}
```

The new personality will take effect in your next OpenCode session.

## Troubleshooting

- **Settings file not found**: Make sure `.opencode/knowledge/settings.json` exists in your project root
- **Personality not loading**: Verify the role name matches exactly (`staff_engineer` or `cthulhu`)
- **Debug logs**: Check `/tmp/opencode-knowledge-debug.log` for detailed plugin activity

## License

MIT License. See the [LICENSE](LICENSE) file for details.
