# Clive PRD - Product Requirements Document

## Overview

**Product Name:** Clive (CLI Visual Editor)

**Tagline:** Flow visualization for Claude Code CLI - Miro in the terminal.

**Version:** 0.1.0 (MVP)

---

## Problem Statement

Complex software has invisible architecture. When building features with conversation flows, multi-step wizards, or state machines:

- Navigation complexity leads to poor UX
- State inconsistencies between transitions
- Copy/text for buttons and messages becomes outdated
- Hard to visualize what needs to change
- Mental model doesn't match the code structure

With AI-assisted coding (Claude Code), developers skip the traditional diagramming step (Miro/Figma) and go straight to "vibe-coding." This creates a gap - no persistent visual artifact exists, and the flow lives in your head + scattered across code files.

---

## Solution

Clive is a side-by-side flow visualization tool that runs alongside Claude Code CLI, enabling users to see and manipulate user flows in real-time as they discuss requirements and write code with Claude.

**Core insight:** The diagram is the shared context between human and AI.

---

## Target Users

1. **Primary:** Claude Code CLI users building applications with user flows
2. **Secondary:** Developers who want version-controlled flow documentation

---

## MVP Scope (v0.1.0)

### User Stories

1. **As a developer**, I want to visualize a `.flow` file in my terminal so I can see the flow structure at a glance.

2. **As a developer**, I want the visualization to auto-update when the file changes so I can see Claude's modifications in real-time.

3. **As a developer**, I want Claude to understand and modify `.flow` files through structured MCP tools so edits are validated and error-free.

4. **As a developer**, I want to see node details (copy, buttons, transitions) so I can review user-facing content.

5. **As a developer**, I want flows stored in `./flows/` directory so I can easily find and version control them.

---

## Technical Requirements

### Tech Stack

| Component | Technology |
|-----------|------------|
| Language | TypeScript |
| Runtime | Node.js 18+ |
| Module System | ESM-only |
| Monorepo | pnpm workspaces + Turbo |
| TUI Framework | Ink (React for terminal) |
| File Watching | Chokidar |
| YAML Parsing | yaml + zod validation |
| MCP Integration | @modelcontextprotocol/sdk |
| Testing | Vitest (unit, integration, snapshot) |

### Package Structure

```
clive/
├── packages/
│   ├── core/                 # Parser, validator, types, layout
│   ├── renderer/             # ASCII rendering
│   ├── cli/                  # Ink TUI application
│   └── mcp-server/           # MCP tools for Claude
├── docs/
├── examples/
└── package.json
```

### Package Dependencies

```
@clive/core
  └── yaml, zod

@clive/renderer
  └── @clive/core

@clive/cli
  └── @clive/core, @clive/renderer, ink, react, chokidar

@clive/mcp-server
  └── @clive/core, @modelcontextprotocol/sdk
```

---

## Functional Requirements

### FR1: `.flow` File Parser (`@clive/core`)

- Parse YAML with `yaml` library
- Validate schema with `zod`
- Support all node types: entry, exit, decision, action, input, error, subprocess
- Extract edges from buttons and transitions
- Return structured `Flow` data type

### FR2: Layout Engine (`@clive/core`)

- Assign nodes to layers (Sugiyama-style)
- Direction: Top-to-bottom (vertical)
- Minimize edge crossings within layers
- Assign x,y coordinates
- Route edges with orthogonal corners
- Handle branching and merging paths

### FR3: ASCII Renderer (`@clive/renderer`)

- Render nodes as boxes with Unicode box-drawing characters
- Node type icons:
  - entry: `○`
  - exit: `◉`
  - decision: `◇`
  - action: `□`
  - input: `▭`
  - error: `⚠`
  - subprocess: `⊞`
- Draw edges with arrows (`│`, `─`, `┌`, `┐`, `└`, `┘`, `▼`, `▶`)
- Standard view with node ID and name
- Detailed view with copy text

### FR4: CLI Application (`@clive/cli`)

**Commands:**

```bash
clive watch <file.flow>    # Watch and render flow (primary command)
clive render <file.flow>   # One-shot render to stdout
clive --version            # Show version
clive --help               # Show help
```

**Watch Mode Features:**
- Full-screen Ink TUI
- Auto-refresh on file change (chokidar)
- Node details panel (shows selected node info)
- Flow metadata header (name, version)
- Error display for invalid YAML/schema

### FR5: MCP Server (`@clive/mcp-server`)

**Tools:**

| Tool | Description | Priority |
|------|-------------|----------|
| `render_flow` | Render .flow file as ASCII for conversation | MVP |
| `get_node` | Get detailed info about a specific node | MVP |
| `list_nodes` | List all nodes with connections | MVP |
| `create_flow` | Create new .flow file | MVP |
| `add_node` | Add node to existing flow | MVP |
| `update_node` | Modify node properties | MVP |
| `delete_node` | Remove node and reconnect edges | v0.2 |
| `update_transition` | Modify edge properties | v0.2 |
| `validate_flow` | Check for errors/warnings | v0.2 |
| `analyze_code` | Extract flow from existing code | v0.3 |

---

## Non-Functional Requirements

### NFR1: Performance
- File change to visual update: < 500ms
- Parse + layout + render for 50-node flow: < 200ms

### NFR2: Compatibility
- Node.js 18+ (matches Claude Code CLI requirement)
- macOS, Linux, Windows (WSL)
- Terminal: 80+ columns recommended

### NFR3: Installation
- End users install via npm: `npm install -g @clive/cli`
- MCP registration: `claude mcp add clive -- clive-mcp`
- No pnpm required for end users (pnpm is dev-only)

### NFR4: Testing
- Unit tests for parser, validator, layout
- Integration tests for CLI commands
- Snapshot tests for ASCII renderer output
- Target: 80%+ code coverage

---

## User Experience

### Installation Flow

```bash
# 1. Install Clive globally
npm install -g @clive/cli

# 2. Register MCP server with Claude Code (one-time)
claude mcp add clive -- clive-mcp

# 3. Start using
clive watch ./flows/onboarding.flow
```

### Typical Workflow

1. User opens two terminal panes side-by-side:
   - Left: `clive watch ./flows/onboarding.flow`
   - Right: Claude Code CLI session

2. User tells Claude: "Create an onboarding flow with signup, email verification, and dashboard"

3. Claude uses `create_flow` MCP tool to generate `./flows/onboarding.flow`

4. Clive detects file change and renders the flow visually

5. User reviews in Clive, tells Claude: "Add a confirmation step before dashboard"

6. Claude uses `add_node` MCP tool to insert the node

7. Clive updates instantly, user sees the change

### Side-by-Side Layout

```
┌─ clive: onboarding.flow ────────────┬─ claude ─────────────────────────────┐
│                                     │                                      │
│  ┌────────────────┐                 │  > Create an onboarding flow with    │
│  │ ○ start        │                 │    signup and email verification     │
│  └───────┬────────┘                 │                                      │
│          │                          │  I'll create that flow for you.      │
│          ▼                          │                                      │
│  ┌────────────────┐                 │  [Uses create_flow tool]             │
│  │ ▭ signup       │                 │                                      │
│  └───────┬────────┘                 │  Done! The flow has been created.    │
│          │                          │                                      │
│          ▼                          │  > Add a "forgot password" branch    │
│  ┌────────────────┐                 │                                      │
│  │ □ verify_email │                 │  [Uses add_node tool]                │
│  └───────┬────────┘                 │                                      │
│          ▼                          │                                      │
│  ┌────────────────┐                 │                                      │
│  │ ◉ dashboard    │                 │                                      │
│  └────────────────┘                 │                                      │
│                                     │                                      │
│ ─────────────────────────────────── │                                      │
│ Node: signup                        │                                      │
│ Type: input                         │                                      │
│ Copy: "Create your account"         │                                      │
└─────────────────────────────────────┴──────────────────────────────────────┘
```

---

## `.flow` File Format

See [FLOW_SPEC.md](./FLOW_SPEC.md) for complete specification.

### Minimal Example

```yaml
meta:
  name: Simple Flow
  version: 1.0.0

nodes:
  start:
    name: Start
    type: entry
    buttons:
      - label: "Begin"
        goto: complete

  complete:
    name: Done
    type: exit
    copy:
      heading: "All done!"
```

---

## Success Criteria

MVP is successful when:

| # | Criteria | Measurement |
|---|----------|-------------|
| 1 | User can run `clive watch` and see ASCII diagram | Manual test |
| 2 | Diagram updates within 1 second of file change | Performance test |
| 3 | Claude can use `render_flow` to show flow in conversation | Integration test |
| 4 | Claude can use `add_node` to insert a new node | Integration test |
| 5 | Claude can use `update_node` to modify node properties | Integration test |
| 6 | Invalid YAML shows clear error message | Manual test |
| 7 | Installation takes < 2 minutes for new user | User test |

---

## Out of Scope for MVP

- Interactive editing in Clive TUI (read-only for MVP)
- Keyboard navigation between nodes
- Multiple view modes (compact, detailed)
- Code analysis/generation (`analyze_code`)
- Multiple flow files open simultaneously
- Subprocess/imports support
- SVG/PNG export
- Themes
- Undo/redo
- Git integration

---

## Future Roadmap

### v0.2.0 - Enhanced Editing
- `delete_node` tool
- `update_transition` tool
- `validate_flow` tool
- Keyboard navigation (arrow keys)
- Multiple view modes
- Focus mode (show N±2 from selected)

### v0.3.0 - Code Integration
- `analyze_code` tool (extract flows from existing code)
- Handler file validation
- Jump to handler in editor

### v0.4.0 - Advanced Features
- Horizontal snaking layout for linear flows
- Subprocess/imports support
- Swimlane layouts
- SVG/PNG export
- Themes

---

## Appendix

### Related Documents
- [VISION.md](./VISION.md) - Product vision and philosophy
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [FLOW_SPEC.md](./FLOW_SPEC.md) - `.flow` file format specification
- [MCP_TOOLS.md](./MCP_TOOLS.md) - MCP tool reference
- [EXAMPLES.md](./EXAMPLES.md) - Example flow files
