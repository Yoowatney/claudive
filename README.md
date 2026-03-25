# claude-dash

Interactive TUI dashboard for [Claude Code](https://claude.ai/claude-code) sessions.

Browse, search, preview, and resume your Claude Code sessions across **all projects** from a single terminal.

[English](README.md) | [한국어](README.ko.md)

## Why?

Claude Code shows sessions per-project. If you work across multiple projects, there's no single place to see everything.

**claude-dash** gives you:
- All sessions from all projects in one view
- Full conversation preview (word wrap supported)
- Session resume (currently supports iTerm2 + tmux environments)
- Vim-style navigation (`j/k`, `/` search, `g/G`)

## Install

```bash
npx @yoyoyoyoo/claude-dash
```

Or install globally:

```bash
npm install -g @yoyoyoyoo/claude-dash
claude-dash
```

## Usage

### Sessions View

```
claudash — Claude Code Session Dashboard  (42 sessions, 5 projects)

[Sessions]  [Projects]

▶ my-app         Fix the login bug and add tests...           2m ago
  api-server     Add rate limiting to /api/v2 endpoints...   3h ago
  docs           Update installation guide for v2...          1d ago
  my-app         Refactor auth middleware...                   2d ago
  infra          Set up CI/CD pipeline with GitHub Actions...  5d ago

42 sessions | 1/42
[Enter] resume  [p] preview  [/] search  [Tab] switch view  [j/k] navigate  [q] quit
```

### Preview Mode

```
Preview  my-app  a1b2c3d4...  12 messages

You:  Fix the login bug and add tests for the auth flow
──────────────────────────────────────────────────────
AI:   I'll start by looking at the auth module to understand
      the current flow, then write a failing test to
      reproduce the bug before fixing it.

You:  Good. Also check if the session token expiry is correct
──────────────────────────────────────────────────────
AI:   Found the issue - the token expiry was set to 24h
      but the refresh logic wasn't accounting for timezone...

100% [j/k] line [u/d] page [g/G] top/bottom [p/Esc] back
```

### Keybindings

| Key | Action |
|-----|--------|
| `j` / `k` / `↑` / `↓` | Navigate sessions |
| `Enter` | Resume selected session |
| `p` | Preview conversation |
| `/` | Search / filter sessions |
| `Tab` | Switch between Sessions / Projects view |
| `q` / `Esc` | Quit |

#### Preview Mode

| Key | Action |
|-----|--------|
| `j` / `k` | Scroll line by line |
| `u` / `d` | Page up / down |
| `g` / `G` | Jump to top / bottom |
| `p` / `Esc` | Back to session list |

## Session Resume

Pressing `Enter` auto-detects your terminal environment:

| Environment | Behavior | Status |
|-------------|----------|--------|
| Inside tmux | Opens new tmux window | Supported |
| macOS + iTerm2 (no tmux) | Opens new iTerm2 tab | Supported |
| Other terminals | Prints the resume command | Fallback |

> **Note:** Terminal.app, Ghostty, Kitty, Alacritty, WezTerm, etc. are not yet natively supported.

Config is saved at `~/.config/claudash/config.json`:

```json
{
  "launchMode": "tmux"
}
```

## How It Works

Reads session data from `~/.claude/projects/` — the same local data Claude Code uses. **Nothing is sent anywhere.**

## Requirements

- Node.js >= 18
- [Claude Code](https://claude.ai/claude-code) installed

## License

MIT
