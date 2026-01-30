# Clive MVP Scope

## Version 0.1.0 - Core Functionality

The MVP focuses on the core loop: **render `.flow` files side-by-side with Claude Code, update via MCP**.

### Must Have

1. **`.flow` file parser** (`@clive/core`)
   - Parse YAML with `yaml` library
   - Validate schema with `zod`
   - Handle all node types: entry, exit, decision, action, input, error
   - Extract edges from buttons and transitions

2. **ASCII renderer** (`@clive/renderer`)
   - Standard view with boxes and arrows
   - Unicode box-drawing characters
   - Node type icons (○ ◉ ◇ □ ▭ ⚠)
   - Edge routing (basic - avoid overlaps)

3. **CLI with watch mode** (`@clive/cli`)
   - `clive watch <file.flow>` - main command
   - Ink-based TUI
   - File watching with chokidar
   - Auto-refresh on file change
   - Node details panel (selected node info)

4. **MCP server** (`@clive/mcp-server`)
   - `render_flow` - return ASCII for display
   - `get_node` - get node details
   - `list_nodes` - list all nodes
   - `update_node` - modify node properties
   - `add_node` - insert new node
   - `create_flow` - create new file

5. **Documentation**
   - README with quick start
   - `.flow` spec document
   - Example flow files

### Nice to Have (v0.2.0)

- `delete_node` tool
- `update_transition` tool
- `validate_flow` tool
- Keyboard navigation (arrow keys between nodes)
- Multiple view modes (compact, standard, detailed)
- Focus mode (show N±2 from selected)
- `clive render` one-shot command

### Future (v0.3.0+)

- Code analysis (`analyze_code` tool)
- SVG/PNG export
- Themes
- Subprocess/imports support
- Swimlane layouts

---

## Development Order

### Phase 1: Foundation (Week 1)

1. **Set up monorepo**
   - npm workspaces
   - TypeScript config
   - Turbo for builds

2. **`@clive/core` package**
   - Types: `Flow`, `Node`, `Edge`, etc.
   - Parser: YAML → Flow data structure
   - Validator: Zod schema

3. **Basic ASCII renderer**
   - Single node rendering
   - Multiple nodes in a line
   - Basic edge (vertical arrow)

### Phase 2: CLI (Week 2)

4. **`@clive/cli` package**
   - Ink app scaffold
   - `clive watch` command
   - File watcher integration
   - Basic diagram display

5. **Layout engine**
   - Layer assignment
   - Simple edge routing
   - Handle branching

### Phase 3: MCP Integration (Week 3)

6. **`@clive/mcp-server` package**
   - MCP server setup
   - `render_flow` tool
   - `get_node` tool
   - `list_nodes` tool

7. **Write tools**
   - `update_node` - modify YAML and save
   - `add_node` - insert node into flow
   - `create_flow` - generate new file

### Phase 4: Polish (Week 4)

8. **Node details panel**
   - Show copy, buttons, transitions
   - Handler file path

9. **Testing with Claude Code**
   - Real workflow testing
   - Iterate on UX
   - Fix edge cases

10. **Documentation & Examples**
    - README
    - Example flows
    - MCP setup guide

---

## Technical Decisions

### Parser

Use `yaml` library with `zod` for validation:

```typescript
import { z } from 'zod';

const NodeSchema = z.object({
  name: z.string(),
  type: z.enum(['entry', 'exit', 'decision', 'action', 'input', 'error', 'subprocess']),
  handler: z.string().optional(),
  copy: z.object({
    heading: z.string().optional(),
    body: z.string().optional(),
    placeholder: z.string().optional(),
  }).optional(),
  buttons: z.array(z.object({
    label: z.string(),
    goto: z.string(),
    style: z.enum(['primary', 'secondary', 'danger', 'link']).optional(),
    condition: z.string().optional(),
    data: z.record(z.unknown()).optional(),
  })).optional(),
  transitions: z.array(z.object({
    to: z.string(),
    trigger: z.enum(['auto', 'condition', 'event']).optional(),
    condition: z.string().optional(),
    label: z.string().optional(),
  })).optional(),
  // ... etc
});
```

### Layout

Start simple - top-to-bottom with basic edge routing:

1. Find entry nodes (layer 0)
2. BFS to assign layers
3. Position nodes in each layer (centered)
4. Draw vertical edges, handle branching

Don't over-engineer layout for MVP. Get something working first.

### MCP Server

Use official `@modelcontextprotocol/sdk`:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'clive',
  version: '0.1.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: 'render_flow', description: '...', inputSchema: {...} },
    // ...
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'render_flow':
      return handleRenderFlow(request.params.arguments);
    // ...
  }
});
```

---

## Success Criteria

MVP is successful when:

1. ✅ User can run `clive watch onboarding.flow` and see ASCII diagram
2. ✅ Diagram updates automatically when file changes
3. ✅ Claude Code can use `render_flow` to show flow in conversation
4. ✅ Claude Code can use `update_node` to modify a node
5. ✅ Claude Code can use `add_node` to insert a new node
6. ✅ Changes made by Claude appear in Clive within 1 second
7. ✅ User can reference node IDs in conversation and Claude understands

---

## Non-Goals for MVP

- ❌ Perfect layout (good enough is fine)
- ❌ Interactive editing in Clive (read-only for MVP)
- ❌ Code analysis/generation
- ❌ Multiple flow files open
- ❌ Undo/redo
- ❌ Git integration
- ❌ Export to other formats
