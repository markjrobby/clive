# Clive Architecture

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **TUI Framework:** Ink (React for the terminal)
- **Monorepo:** npm workspaces + Turbo
- **File Watching:** Chokidar
- **YAML Parsing:** yaml + zod for validation
- **MCP Integration:** @modelcontextprotocol/sdk

## Project Structure

```
clive/
├── packages/
│   ├── core/                 # TypeScript
│   │   ├── parser/          # .flow YAML parser
│   │   ├── validator/       # Schema validation with Zod
│   │   ├── types/           # Shared TypeScript types
│   │   └── layout/          # Graph layout algorithms
│   │
│   ├── renderer/            # TypeScript
│   │   ├── ascii/           # Box-drawing renderer
│   │   └── themes/          # Visual themes
│   │
│   ├── cli/                 # TypeScript + Ink
│   │   ├── app.tsx          # Main Ink app
│   │   ├── components/      # Ink React components
│   │   ├── hooks/           # React hooks (useFlowFile, useLayout)
│   │   ├── commands/        # CLI commands
│   │   └── watcher.ts       # File watching
│   │
│   └── mcp-server/          # TypeScript
│       ├── server.ts        # MCP server entry
│       ├── tools/           # MCP tool definitions
│       └── handlers/        # Tool implementations
│
├── docs/                    # Documentation
├── examples/                # Example .flow files
└── README.md
```

## Package Dependencies

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

## Data Flow

### Watch Mode (Primary Use Case)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   User types in Claude Code: "Add a confirmation step at N3"   │
│                              ↓                                  │
│   Claude uses MCP tool: update_flow({add_node: "N3.confirm"})  │
│                              ↓                                  │
│   MCP server writes to: ./flows/onboarding.flow                │
│                              ↓                                  │
│   Clive detects file change (chokidar)                         │
│                              ↓                                  │
│   Clive re-parses and re-layouts the flow                      │
│                              ↓                                  │
│   Clive re-renders ASCII diagram                               │
│                              ↓                                  │
│   User sees update instantly in left pane                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Layout Pipeline

```
.flow file (YAML)
       ↓
   Parser (@clive/core)
       ↓
   Flow data structure
       ↓
   Layout engine (@clive/core/layout)
   - Assign nodes to layers
   - Minimize edge crossings
   - Assign coordinates
   - Route edges
       ↓
   ASCII renderer (@clive/renderer)
       ↓
   String[] (rows of ASCII art)
       ↓
   Ink components (@clive/cli)
       ↓
   Terminal output
```

## Layout Algorithm

Using Sugiyama-style layered layout:

1. **Layer Assignment** - Assign nodes to layers based on longest path from entry
2. **Crossing Minimization** - Order nodes within layers to minimize edge crossings
3. **Coordinate Assignment** - Assign x,y coordinates based on layer and position
4. **Edge Routing** - Route edges avoiding node overlaps

### Layout Options

- **Direction:** Top-to-bottom (TB) or Left-to-right (LR)
- **Node spacing:** Configurable horizontal/vertical gaps
- **View modes:** Compact, Standard, Detailed

## Side-by-Side Experience

Using tmux or terminal split:

```
┌─ clive: onboarding.flow ────────────┬─ claude ─────────────────────────────┐
│                                     │                                      │
│  [Interactive flow diagram]         │  Claude Code CLI session             │
│                                     │                                      │
│  - File watcher auto-refreshes      │  - User discusses changes            │
│  - Arrow keys to navigate           │  - Claude uses MCP tools             │
│  - Node details panel below         │  - Changes reflect in Clive          │
│                                     │                                      │
└─────────────────────────────────────┴──────────────────────────────────────┘
```

## ASCII Rendering

### Node Types and Icons

| Type | Icon | Description |
|------|------|-------------|
| `entry` | `○` | Where users enter the flow |
| `exit` | `◉` | Where users leave the flow |
| `decision` | `◇` | Branching point with multiple paths |
| `action` | `□` | System does something |
| `input` | `▭` | User provides information |
| `error` | `⚠` | Error state |
| `subprocess` | `⊞` | Embedded sub-flow |

### View Modes

**Compact:**
```
N1→N2→N3
   ↓
  N2a
```

**Standard:**
```
┌────────────────┐
│ ○ N1:Start     │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ ◇ N2:Select    │
└───────┬────────┘
```

**Detailed:**
```
┌──────────────────────┐
│ ○ N1:Start           │
│ ──────────────────── │
│ "Welcome!"           │
│ [Begin →]            │
└──────────┬───────────┘
           │
           ▼
```

## Keyboard Navigation (Future)

- Arrow keys: Move selection between nodes
- Enter: Expand/focus selected node
- Esc: Zoom out
- `/`: Search nodes
- `g N5`: Go to node N5
- `1/2/3`: Switch view modes
- `q`: Quit
