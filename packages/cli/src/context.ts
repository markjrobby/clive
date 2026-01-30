/**
 * Bundled CLAUDE.md context content for Clive sessions.
 * Injected into the project's .claude/CLAUDE.md so Claude Code knows
 * about the diagram viewer running in the side panel.
 */
export const CLIVE_CONTEXT = `# Clive Flow Visualization

A flow diagram viewer is running in the side panel. When designing user interactions or multi-step processes, **create a \`.mmd\` file** (Mermaid format) to visualize it - the diagram will automatically appear.

## When to Create a Diagram

Create a \`.mmd\` file whenever you're designing:
- User onboarding or signup flows
- Checkout/payment processes
- Multi-step forms or wizards
- Authentication flows
- State machines or process flows
- Any system with user decisions or steps

## Mermaid Flowchart Syntax

Create a file like \`checkout.mmd\` in the project root:

\`\`\`mermaid
flowchart TD
    cart[Cart] --> payment[Payment]
    payment --> confirmation[Order Confirmed!]
    payment --> error[Payment Failed]
    error --> payment
\`\`\`

### Common Patterns

**Linear flow:**
\`\`\`mermaid
flowchart TD
    A[Start] --> B[Step 1] --> C[Step 2] --> D[Done]
\`\`\`

**Decision/branching:**
\`\`\`mermaid
flowchart TD
    A[Start] --> B{Choose Plan}
    B -->|Free| C[Free Tier]
    B -->|Pro| D[Pro Tier]
    B -->|Enterprise| E[Enterprise]
\`\`\`

**With subgraphs (grouping):**
\`\`\`mermaid
flowchart TD
    subgraph Onboarding
        A[Welcome] --> B[Create Account]
        B --> C[Verify Email]
    end
    subgraph Setup
        C --> D[Choose Plan]
        D --> E[Add Payment]
    end
    E --> F[Complete]
\`\`\`

### Node Shapes

- \`[text]\` - Rectangle (default)
- \`{text}\` - Diamond (decision)
- \`([text])\` - Stadium/pill shape
- \`[[text]]\` - Subroutine
- \`[(text)]\` - Cylinder (database)
- \`((text))\` - Circle

### Edge Labels

\`\`\`mermaid
flowchart TD
    A --> |"Yes"| B
    A --> |"No"| C
\`\`\`

## Workflow

1. **Create the .mmd file first** to visualize the user journey
2. **Discuss with the user** - they can see it in the side panel
3. **Iterate** on the diagram as requirements change
4. **Then implement** the code once the flow is agreed

## Reference

Full Mermaid syntax: https://mermaid.js.org/syntax/flowchart.html
`

export const CLIVE_CONTEXT_MARKER = 'Clive Flow Visualization'
