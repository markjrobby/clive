# Flow Visualizer

When working on projects that involve user interactions, multi-step processes, or user journeys, create a `.flow` file to visualize the flow diagram. This file will be automatically rendered in a side panel if the user is running a clive-session.

## When to Create a .flow File

Create a `.flow` file whenever you're designing or implementing:
- User onboarding flows
- Checkout/payment processes
- Multi-step forms or wizards
- Authentication flows (login, signup, password reset)
- User journeys or navigation paths
- State machines with user-facing states
- Any process with decision points and multiple paths

## .flow File Format

Create the `.flow` file in the project root (e.g., `checkout.flow`, `onboarding.flow`):

```yaml
meta:
  name: Flow Name
  description: Brief description of what this flow does

nodes:
  # Entry point - where the flow starts
  start:
    name: Start
    type: entry
    copy:
      heading: "Welcome heading"
      body: "Optional description text"
    buttons:
      - label: "Button text"
        goto: next_node_id
        style: primary

  # Decision point - multiple choices
  choose_option:
    name: Choose Option
    type: decision
    copy:
      heading: "What would you like to do?"
    buttons:
      - label: "Option A"
        goto: option_a
      - label: "Option B"
        goto: option_b

  # Action - single step
  process_step:
    name: Process Step
    type: action
    copy:
      heading: "Processing..."
      body: "Description of what happens"
    buttons:
      - label: "Continue"
        goto: next_step
        style: primary

  # Input - user enters text
  enter_email:
    name: Enter Email
    type: input
    copy:
      heading: "Enter your email"
      placeholder: "email@example.com"
    transitions:
      - to: next_step
        trigger: valid_input
      - to: error_state
        trigger: invalid_input

  # Error state
  error_state:
    name: Error
    type: error
    copy:
      body: "Something went wrong"
    transitions:
      - to: previous_step
        trigger: retry

  # Exit point - flow ends
  complete:
    name: Complete
    type: exit
    copy:
      heading: "All done!"
      body: "Success message"
```

## Node Types

| Type | Icon | Use for |
|------|------|---------|
| `entry` | ○ | Starting point of the flow |
| `exit` | ◉ | End point(s) of the flow |
| `decision` | ◇ | Multiple choice / branching |
| `action` | □ | Single action or process step |
| `input` | ▭ | User text/data input |
| `error` | ⚠ | Error states |

## Workflow

1. **Create the .flow file first** - Visualize the flow before writing implementation code
2. **Discuss with the user** - Let them see and refine the flow structure
3. **Iterate** - Update the .flow file as requirements change
4. **Then implement** - Write the actual code once the flow is agreed upon

## Tips

- Keep node IDs short and descriptive: `start`, `select_plan`, `payment`, `complete`
- Use `goto` in buttons to connect nodes
- Use `transitions` for automatic/conditional transitions (like form validation)
- The flow pane auto-updates when you save the file
