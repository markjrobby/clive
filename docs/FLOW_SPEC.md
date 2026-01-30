# `.flow` File Specification

The `.flow` file format is a YAML-based specification for describing user flows, state machines, and navigation graphs.

## File Structure

```yaml
# <name>.flow

meta:
  name: string           # Human-readable name (required)
  version: string        # Semver version
  description: string    # What this flow does
  owner: string          # Who maintains it
  tags: [string]         # For organization

config:
  layout: horizontal | vertical | auto
  theme: default | minimal | detailed

imports:                 # Optional: import other flows
  - path: ./shared/error-handling.flow
    prefix: err

nodes:
  <node_id>:
    # ... node definition (see below)

edges:                   # Optional: explicit edge styling
  N1->N2:
    label: string
    style: solid | dashed | dotted
    color: string
```

## Node Definition

```yaml
<node_id>:
  name: string                    # Display name (required)
  type: entry | exit | decision | action | input | error | subprocess
  handler: string                 # Optional: code location (e.g., "src/handlers/auth.py:45")
  description: string             # What happens at this node

  copy:                           # User-facing text
    heading: string               # Main title/message
    body: string                  # Supporting text
    placeholder: string           # For input fields

  buttons:                        # Interactive elements (for decision/action nodes)
    - label: string               # Button text (required)
      style: primary | secondary | danger | link
      goto: node_id               # Target node (required)
      condition: string           # Optional: when to show this button
      data: object                # Data passed to next node

  transitions:                    # Non-button transitions (for input/error nodes)
    - to: node_id                 # Target node (required)
      trigger: auto | condition | event
      condition: string           # Condition expression
      label: string               # Edge label

  state:                          # Data flow
    requires: [string]            # Must have these variables to enter
    sets: [string]                # Variables this node produces
    clears: [string]              # Variables this node removes

  validation:                     # For input nodes
    - type: email | phone | regex | min_length | max_length | custom
      pattern: string             # For regex type
      value: number               # For min/max length
      error: string               # Error message to show

  notes: string                   # Developer notes (shown in detailed view)

  # For subprocess type
  subprocess: path/to/other.flow

  # For error type
  parent: node_id                 # Which node this error belongs to
```

## Node Types

### entry
Where users enter the flow. A flow should have at least one entry node.

```yaml
start:
  name: Start
  type: entry
  copy:
    heading: "Welcome!"
  buttons:
    - label: "Begin"
      goto: step_1
```

### exit
Where users leave the flow. Terminal nodes.

```yaml
complete:
  name: Complete
  type: exit
  copy:
    heading: "All done!"
  state:
    sets: [flow_completed]
```

### decision
Branching point with multiple paths based on user choice.

```yaml
select_plan:
  name: Select Plan
  type: decision
  copy:
    heading: "Choose your plan"
  buttons:
    - label: "Pro"
      goto: checkout
      data: { plan: "pro" }
    - label: "Free"
      goto: free_setup
      data: { plan: "free" }
```

### action
System performs an action (API call, processing, etc.).

```yaml
process_payment:
  name: Process Payment
  type: action
  handler: src/payments.py:process
  copy:
    heading: "Processing..."
  transitions:
    - to: success
      condition: payment_success
    - to: payment_error
      condition: payment_failed
```

### input
User provides information.

```yaml
enter_email:
  name: Enter Email
  type: input
  copy:
    heading: "What's your email?"
    placeholder: "you@example.com"
  validation:
    - type: email
      error: "Please enter a valid email"
  transitions:
    - to: next_step
      trigger: valid_input
    - to: email_error
      trigger: invalid_input
```

### error
Error state, typically returns to parent node.

```yaml
email_error:
  name: Email Error
  type: error
  parent: enter_email
  copy:
    body: "That email doesn't look right. Please try again."
  transitions:
    - to: enter_email
      trigger: retry
```

### subprocess
Embeds another flow file.

```yaml
payment_flow:
  name: Payment
  type: subprocess
  subprocess: ./flows/payment.flow
  transitions:
    - to: success
      condition: subprocess_complete
    - to: cancelled
      condition: subprocess_cancelled
```

## Complete Example

```yaml
# onboarding.flow

meta:
  name: User Onboarding
  version: 2.1.0
  description: New user signup and plan selection flow
  owner: "@markjrobert"

nodes:
  start:
    name: Start
    type: entry
    copy:
      heading: "Welcome to JobAlertBot!"
      body: "Let's get you set up in 60 seconds."
    buttons:
      - label: "Let's go!"
        goto: select_role
        style: primary

  select_role:
    name: Select Role
    type: decision
    handler: src/handlers/onboarding.py:select_role
    copy:
      heading: "What role are you looking for?"
    buttons:
      - label: "Software Engineer"
        goto: select_level
        data: { role: "swe" }
      - label: "Product Manager"
        goto: select_level
        data: { role: "pm" }
      - label: "Designer"
        goto: select_level
        data: { role: "design" }
      - label: "Other"
        goto: custom_role

  custom_role:
    name: Enter Custom Role
    type: input
    handler: src/handlers/onboarding.py:custom_role
    copy:
      heading: "What role are you looking for?"
      placeholder: "e.g., Data Scientist"
    validation:
      - type: min_length
        value: 2
        error: "Please enter a role"
    transitions:
      - to: select_level
        trigger: valid_input
      - to: custom_role_error
        trigger: invalid_input

  custom_role_error:
    name: Role Input Error
    type: error
    parent: custom_role
    copy:
      body: "Please enter a valid role (at least 2 characters)"
    transitions:
      - to: custom_role
        trigger: retry

  select_level:
    name: Select Level
    type: decision
    handler: src/handlers/onboarding.py:select_level
    copy:
      heading: "What's your experience level?"
    buttons:
      - label: "Entry (0-2 years)"
        goto: select_location
        data: { level: "entry" }
      - label: "Mid (2-5 years)"
        goto: select_location
        data: { level: "mid" }
      - label: "Senior (5+ years)"
        goto: select_location
        data: { level: "senior" }

  select_location:
    name: Select Location
    type: decision
    handler: src/handlers/onboarding.py:select_location
    copy:
      heading: "Where do you want to work?"
    buttons:
      - label: "Remote Only"
        goto: confirm
        data: { location: "remote" }
      - label: "Hybrid"
        goto: enter_city
        data: { location: "hybrid" }
      - label: "On-site"
        goto: enter_city
        data: { location: "onsite" }

  enter_city:
    name: Enter City
    type: input
    handler: src/handlers/onboarding.py:enter_city
    copy:
      heading: "Which city?"
      placeholder: "e.g., San Francisco"
    transitions:
      - to: confirm
        trigger: valid_input

  confirm:
    name: Confirm Preferences
    type: action
    handler: src/handlers/onboarding.py:confirm
    copy:
      heading: "Here's your profile:"
      body: "Role: {role}\nLevel: {level}\nLocation: {location}"
    buttons:
      - label: "Looks good!"
        goto: complete
        style: primary
      - label: "Start over"
        goto: select_role
        style: secondary

  complete:
    name: Setup Complete
    type: exit
    handler: src/handlers/onboarding.py:complete
    copy:
      heading: "You're all set!"
      body: "I'll send you matching jobs as soon as I find them."
    state:
      sets: [onboarding_complete]
```

## Best Practices

1. **Node IDs** - Use snake_case, be descriptive (`select_plan` not `n1`)
2. **Copy** - Write actual user-facing text, not placeholders
3. **Handlers** - Include file:line for easy navigation
4. **Error nodes** - Always set `parent` to link back to the originating node
5. **State** - Document what data each node requires and produces
6. **Notes** - Add context for complex logic
