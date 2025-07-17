# Claude Code CLI Commands Reference

This document provides a comprehensive reference for all Claude Code CLI commands, flags, and features based on the latest 2025 documentation.

## Installation

```bash
npm install -g @anthropic-ai/claude-code
```

**Requirements**: Node.js 18+ on macOS, Linux, or WSL

## Basic Usage

### Core Commands

| Command | Description |
|---------|-------------|
| `claude` | Start interactive REPL session |
| `claude "query"` | Start REPL with initial prompt |
| `claude -p "query"` | Query via SDK, then exit (headless mode) |
| `cat file \| claude -p "query"` | Process piped content |
| `claude -c` | Continue most recent conversation |
| `claude -c -p "query"` | Continue via SDK |
| `claude -r "<session-id>" "query"` | Resume session by ID |
| `claude update` | Update to latest version |
| `claude mcp` | Configure Model Context Protocol servers |

### CLI Flags and Options

| Flag | Description |
|------|-------------|
| `--add-dir` | Add working directories |
| `--allowedTools` | Specify allowed tools |
| `--disallowedTools` | Specify disallowed tools |
| `--print` / `-p` | Print response without interactive mode |
| `--output-format` | Specify output format (text/json/stream-json) |
| `--input-format` | Specify input format |
| `--verbose` | Enable detailed logging |
| `--max-turns` | Limit agentic turns |
| `--model` | Set session model |
| `--permission-mode` | Begin in specific permission mode |
| `--resume` / `-c` | Resume specific session |
| `--continue` | Load most recent conversation |
| `--dangerously-skip-permissions` | Skip permission prompts |
| `--mcp-debug` | Debug MCP configuration issues |
| `--json` | JSON output for automated processing |

## Session Management

### Starting Sessions

- **New Session**: `claude` - Clean context, fresh start
- **Resume Last**: `claude --resume` - Resume with full context
- **List Sessions**: `claude --sessions` - View and select past sessions
- **Headless Mode**: `claude -p "prompt"` - Direct output without interaction

### Session Configuration

```bash
# Set global notification preferences
claude config set --global preferredNotifChannel terminal_bell

# Start with specific model
claude --model claude-3-5-sonnet-20241022

# Start with verbose logging
claude --verbose
```

## In-Session Commands (Slash Commands)

### Built-in Commands

| Command | Description |
|---------|-------------|
| `/help` | List all available slash commands |
| `/init` | Create CLAUDE.md for project memory |
| `/clear` | Reset session context |
| `/compact` | Summarize conversation to save context |
| `/review` | Review PR, file, or code block |
| `/model` | Switch between Claude models |
| `/overview` | Get repository overview |
| `/tree` | Display project directory structure |
| `/permissions` | Add domains to allowlist |
| `/hooks` | Set up pre/post tool use hooks |

### Custom Slash Commands

Create custom commands by placing Markdown files in `.claude/commands/`:

```bash
.claude/
  commands/
    debug.md      # Available as /debug
    analyze.md    # Available as /analyze
```

## MCP (Model Context Protocol) Integration

### Configuration Types

1. **Project Config** - Available when running in specific directory
2. **Checked-in .mcp.json** - Available to all team members
3. **Global Config** - Available across all projects

### MCP Setup

```bash
# Configure MCP servers
claude mcp

# Debug MCP issues
claude --mcp-debug
```

## Advanced Usage Patterns

### Piping and Composition

```bash
# Process log files
tail -f app.log | claude -p "Alert me to anomalies"

# Analyze data
cat data.csv | claude -p "Who won the most games?"

# Code review
git diff | claude -p "Review this diff"
```

### Automation Examples

```bash
# JSON output for scripts
claude -p "analyze this code" --output-format json

# Stream processing
claude -p "monitor logs" --output-format stream-json

# Batch processing
for file in *.py; do
  claude -p "review $file" --output-format text >> review.txt
done
```

## Project Integration

### CLAUDE.md File

Create a `CLAUDE.md` file in your project root to provide context:

```bash
claude /init  # Creates template CLAUDE.md
```

This file should contain:
- Project architecture overview
- Development commands
- Coding conventions
- Dependencies and setup instructions

### Git Workflow Integration

```bash
# Review changes before commit
git diff | claude -p "Review these changes"

# Generate commit messages
git diff --staged | claude -p "Generate commit message"

# Code review
claude -p "Review PR #123"
```

## Configuration Files

### Permission Settings

Location: `.claude/settings.local.json`

```json
{
  "allowedTools": ["Bash(find:*)", "Bash(ls:*)"],
  "permissions": {
    "domains": ["docs.example.com"]
  }
}
```

### MCP Configuration

Location: `.mcp.json`

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
    }
  }
}
```

## Best Practices

### Session Management

- Use `claude --resume` to maintain context between sessions
- Use `/compact` when approaching context limits
- Use `/clear` when switching to unrelated tasks

### Code Organization

- Create custom slash commands for repeated workflows
- Use CLAUDE.md to document project-specific conventions
- Set up MCP servers for enhanced tool access

### Automation

- Use headless mode (`-p`) for scripting
- Leverage `--output-format json` for programmatic processing
- Pipe data for efficient processing workflows

## Troubleshooting

### Common Issues

- **Permission Errors**: Use `/permissions` to add trusted domains
- **MCP Issues**: Use `--mcp-debug` flag for diagnostics
- **Context Limits**: Use `/compact` to summarize conversations
- **Tool Access**: Check `.claude/settings.local.json` for allowed tools

### Debug Options

```bash
# Verbose logging
claude --verbose

# MCP debugging
claude --mcp-debug

# Skip permission prompts (use carefully)
claude --dangerously-skip-permissions
```

## Community Resources

- [Official Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code)
- [Community Guide](https://github.com/zebbern/claude-code-guide)
- [Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

---

*Last updated: July 2025*
*Based on Claude Code CLI documentation and community resources*