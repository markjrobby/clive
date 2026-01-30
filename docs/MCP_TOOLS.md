# Clive MCP Tools

Clive integrates with Claude Code CLI via the Model Context Protocol (MCP). These tools allow Claude to read, create, and modify `.flow` files.

## Tool Reference

### render_flow

Render a `.flow` file as ASCII art for display in conversation.

```typescript
{
  name: "render_flow",
  description: "Render a .flow file as ASCII art for display",
  parameters: {
    flow_file: string,      // Path to .flow file (required)
    focus_node?: string,    // Center view on this node
    depth?: number,         // How many levels to show (default: all)
    view?: "compact" | "standard" | "detailed",
    show_copy?: boolean,    // Include user-facing text
  }
}
```

**Example usage by Claude:**
```
User: Show me the onboarding flow

Claude: [Uses render_flow tool]

Here's your onboarding flow:

┌─────────────────────────────────────────────────────────┐
│  USER ONBOARDING (v2.1.0)                               │
├─────────────────────────────────────────────────────────┤
│  ○ N1:Start                                             │
│      │                                                  │
│      ▼                                                  │
│  ◇ N2:Select Plan ──[Skip]──▶ □ N4:Free Trial          │
│      │                              │                   │
│      ▼                              │                   │
│  ▭ N3:Enter Email                   │                   │
│      │                              │                   │
│      ▼                              ▼                   │
│  ◉ N5:Dashboard ◀───────────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

---

### get_node

Get detailed information about a specific node.

```typescript
{
  name: "get_node",
  description: "Get detailed information about a specific node",
  parameters: {
    flow_file: string,      // Path to .flow file (required)
    node_id: string,        // Node ID to retrieve (required)
  }
}
```

**Returns:**
```json
{
  "id": "select_plan",
  "name": "Select Plan",
  "type": "decision",
  "handler": "src/flows/onboarding.py:45",
  "copy": {
    "heading": "Choose your plan",
    "body": "All plans include a 14-day free trial."
  },
  "buttons": [
    { "label": "Pro ($10/mo)", "goto": "enter_email" },
    { "label": "Free", "goto": "free_trial" }
  ],
  "incoming_edges": ["start"],
  "outgoing_edges": ["enter_email", "free_trial"]
}
```

---

### list_nodes

List all nodes in a flow with their connections.

```typescript
{
  name: "list_nodes",
  description: "List all nodes in a flow with their connections",
  parameters: {
    flow_file: string,      // Path to .flow file (required)
  }
}
```

**Returns:**
```json
{
  "meta": { "name": "Onboarding", "version": "2.1.0" },
  "nodes": [
    { "id": "start", "name": "Start", "type": "entry", "outgoing": ["select_plan"] },
    { "id": "select_plan", "name": "Select Plan", "type": "decision", "outgoing": ["enter_email", "free_trial"] },
    ...
  ]
}
```

---

### create_flow

Create a new `.flow` file from a description.

```typescript
{
  name: "create_flow",
  description: "Create a new .flow file from a description",
  parameters: {
    output_path: string,    // Where to save the file (required)
    name: string,           // Flow name (required)
    description?: string,   // Flow description
    version?: string,       // Initial version (default: "1.0.0")
    nodes: Array<{          // Initial nodes (required)
      id: string,
      name: string,
      type: string,
      copy?: object,
      buttons?: array,
      transitions?: array,
    }>
  }
}
```

**Example usage by Claude:**
```
User: Create an onboarding flow with signup, email verification, and dashboard

Claude: I'll create that flow for you.

[Uses create_flow tool with nodes:
  - start: entry
  - signup: input
  - verify_email: action
  - dashboard: exit
]

Done. I've created the flow at ./flows/onboarding.flow
You should see it appear in Clive now.
```

---

### add_node

Add a new node to an existing flow.

```typescript
{
  name: "add_node",
  description: "Add a new node to an existing flow",
  parameters: {
    flow_file: string,      // Path to .flow file (required)
    node_id: string,        // ID for the new node (required)
    node_config: {          // Node configuration (required)
      name: string,
      type: string,
      copy?: object,
      buttons?: array,
      transitions?: array,
      handler?: string,
    },
    insert_after?: string,  // Insert after this node
    connect_from?: string,  // Create edge from this node
    connect_to?: string,    // Create edge to this node
  }
}
```

**Example usage by Claude:**
```
User: Add a confirmation step between select_plan and enter_email

Claude: I'll add a confirmation node.

[Uses add_node tool:
  node_id: "confirm_plan"
  node_config: { name: "Confirm Plan", type: "decision", ... }
  connect_from: "select_plan"
  connect_to: "enter_email"
]

Done. The flow now goes: select_plan → confirm_plan → enter_email
```

---

### update_node

Update properties of an existing node.

```typescript
{
  name: "update_node",
  description: "Update properties of an existing node",
  parameters: {
    flow_file: string,      // Path to .flow file (required)
    node_id: string,        // Node to update (required)
    updates: {              // Properties to update (required)
      name?: string,
      type?: string,
      copy?: object,
      buttons?: array,
      transitions?: array,
      handler?: string,
      state?: object,
    }
  }
}
```

**Example usage by Claude:**
```
User: Change the heading on select_plan to "Pick your perfect plan"

Claude: [Uses update_node tool:
  node_id: "select_plan"
  updates: { copy: { heading: "Pick your perfect plan" } }
]

Done. The heading has been updated.
```

---

### delete_node

Remove a node and optionally reconnect edges.

```typescript
{
  name: "delete_node",
  description: "Remove a node and its connections",
  parameters: {
    flow_file: string,      // Path to .flow file (required)
    node_id: string,        // Node to delete (required)
    reconnect?: boolean,    // Auto-reconnect orphaned edges (default: false)
  }
}
```

**Example:**
```
Before: A → B → C
delete_node(B, reconnect=true)
After:  A → C
```

---

### update_transition

Modify a transition between nodes.

```typescript
{
  name: "update_transition",
  description: "Modify a transition between nodes",
  parameters: {
    flow_file: string,      // Path to .flow file (required)
    from_node: string,      // Source node (required)
    to_node: string,        // Current target node (required)
    updates?: {             // Updates to apply
      label?: string,
      condition?: string,
      style?: string,
    },
    new_target?: string,    // Redirect to different node
  }
}
```

**Example usage by Claude:**
```
User: The skip button on N2 should go to N5 instead of N4

Claude: [Uses update_transition tool:
  from_node: "N2"
  to_node: "N4"
  new_target: "N5"
]

Done. N2's skip button now goes to N5.
```

---

### validate_flow

Check a flow for errors and issues.

```typescript
{
  name: "validate_flow",
  description: "Check a flow for errors and issues",
  parameters: {
    flow_file: string,      // Path to .flow file (required)
    check_handlers?: boolean,  // Verify handler files exist (default: false)
  }
}
```

**Returns:**
```json
{
  "valid": false,
  "errors": [
    { "type": "orphan_node", "node": "old_step", "message": "Node has no incoming edges and is not an entry" },
    { "type": "missing_handler", "node": "process", "handler": "src/missing.py:10" }
  ],
  "warnings": [
    { "type": "no_exit", "message": "Flow has no exit nodes" }
  ]
}
```

---

### analyze_code

Analyze existing code to generate a `.flow` file. (Future feature)

```typescript
{
  name: "analyze_code",
  description: "Analyze code to generate a .flow file",
  parameters: {
    source_path: string,      // Path to source code (required)
    framework_hint?: string,  // "telegram", "react", "fastapi", etc.
    output_path: string,      // Where to save generated .flow (required)
  }
}
```

---

## MCP Server Configuration

To use Clive with Claude Code, add to your Claude Code MCP config:

```json
{
  "mcpServers": {
    "clive": {
      "command": "npx",
      "args": ["@clive/mcp-server"],
      "env": {}
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "clive": {
      "command": "clive-mcp",
      "args": [],
      "env": {}
    }
  }
}
```

## Conversation Examples

### Creating a new flow

```
User: I need a checkout flow with cart review, shipping info, payment, and confirmation

Claude: I'll create a checkout flow for you.

[Uses create_flow with 4 nodes]

Here's the flow I've created:

○ cart_review → ▭ shipping → ▭ payment → ◉ confirmation

You should see it in Clive now. Would you like me to add error handling
for payment failures?
```

### Modifying based on visual feedback

```
User: Looking at Clive, the payment node should have a "back" button
      that returns to shipping

Claude: I'll add a back button to the payment node.

[Uses update_node to add button with goto: shipping]

Done. Payment now has:
- [Complete Payment] → confirmation
- [← Back] → shipping
```

### Restructuring a flow

```
User: Actually, we need to collect email before showing the cart.
      Move the email step to the beginning.

Claude: I'll restructure the flow. Here's what will change:

Current: cart → shipping → payment → confirm
New:     email → cart → shipping → payment → confirm

[Uses add_node, update_transition to restructure]

Done. The flow now starts with email collection.
```
