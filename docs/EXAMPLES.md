# Example Flows

## Simple Linear Flow

A basic 3-step flow with no branching.

```yaml
# simple.flow
meta:
  name: Simple Form
  version: 1.0.0

nodes:
  start:
    name: Start
    type: entry
    copy:
      heading: "Let's begin"
    buttons:
      - label: "Next"
        goto: step_1

  step_1:
    name: Enter Name
    type: input
    copy:
      heading: "What's your name?"
      placeholder: "John Doe"
    transitions:
      - to: complete
        trigger: valid_input

  complete:
    name: Done
    type: exit
    copy:
      heading: "Thanks, {name}!"
```

**Renders as:**
```
○ start
    │
    ▼
▭ step_1
    │
    ▼
◉ complete
```

---

## Branching Decision Flow

Flow with multiple paths based on user choice.

```yaml
# branching.flow
meta:
  name: Plan Selection
  version: 1.0.0

nodes:
  start:
    name: Welcome
    type: entry
    copy:
      heading: "Welcome!"
    buttons:
      - label: "Get Started"
        goto: select_plan

  select_plan:
    name: Select Plan
    type: decision
    copy:
      heading: "Choose your plan"
    buttons:
      - label: "Pro"
        goto: pro_features
        data: { plan: "pro" }
      - label: "Free"
        goto: free_setup
        data: { plan: "free" }

  pro_features:
    name: Pro Features
    type: action
    copy:
      heading: "Unlocking Pro features..."
    transitions:
      - to: dashboard
        trigger: auto

  free_setup:
    name: Free Setup
    type: action
    copy:
      heading: "Setting up free account..."
    transitions:
      - to: dashboard
        trigger: auto

  dashboard:
    name: Dashboard
    type: exit
    copy:
      heading: "You're all set!"
```

**Renders as:**
```
○ start
    │
    ▼
◇ select_plan
    │         │
    │ [Pro]   │ [Free]
    ▼         ▼
□ pro     □ free_setup
    │         │
    └────┬────┘
         ▼
    ◉ dashboard
```

---

## Input with Error Handling

Flow with validation and error recovery.

```yaml
# validation.flow
meta:
  name: Email Collection
  version: 1.0.0

nodes:
  start:
    name: Start
    type: entry
    buttons:
      - label: "Continue"
        goto: enter_email

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
      - to: confirm
        trigger: valid_input
      - to: email_error
        trigger: invalid_input

  email_error:
    name: Invalid Email
    type: error
    parent: enter_email
    copy:
      body: "That doesn't look like a valid email. Please try again."
    transitions:
      - to: enter_email
        trigger: retry

  confirm:
    name: Confirm
    type: action
    copy:
      heading: "We'll send updates to {email}"
    buttons:
      - label: "Confirm"
        goto: complete
      - label: "Change"
        goto: enter_email

  complete:
    name: Complete
    type: exit
    copy:
      heading: "You're subscribed!"
```

**Renders as:**
```
○ start
    │
    ▼
▭ enter_email ◀────┐
    │       │      │
    │       │[invalid]
    │       ▼      │
    │    ⚠ error ──┘
    │[valid]
    ▼
□ confirm
    │     │
    │     │[Change]
    │     └────────▶ (back to enter_email)
    │[Confirm]
    ▼
◉ complete
```

---

## Telegram Bot Onboarding

Real-world example for a Telegram job alert bot.

```yaml
# telegram-onboarding.flow
meta:
  name: JobAlertBot Onboarding
  version: 2.1.0
  description: New user setup flow for Telegram bot

nodes:
  start:
    name: /start Command
    type: entry
    handler: src/handlers/start.py:handle_start
    copy:
      heading: "Welcome to JobAlertBot! 🎯"
      body: "I'll help you find your dream job. Let's set up your preferences."
    buttons:
      - label: "Let's go!"
        goto: select_role
        style: primary

  select_role:
    name: Select Job Role
    type: decision
    handler: src/handlers/onboarding.py:select_role
    copy:
      heading: "What type of role are you looking for?"
    buttons:
      - label: "🧑‍💻 Software Engineer"
        goto: select_level
        data: { role: "software_engineer" }
      - label: "📊 Data Scientist"
        goto: select_level
        data: { role: "data_scientist" }
      - label: "🎨 Designer"
        goto: select_level
        data: { role: "designer" }
      - label: "📝 Other..."
        goto: custom_role

  custom_role:
    name: Enter Custom Role
    type: input
    handler: src/handlers/onboarding.py:custom_role
    copy:
      heading: "What role are you looking for?"
      placeholder: "Product Manager, DevOps Engineer, etc."
    validation:
      - type: min_length
        value: 3
        error: "Please enter a role (at least 3 characters)"
    transitions:
      - to: select_level
        trigger: valid_input
      - to: custom_role_error
        trigger: invalid_input

  custom_role_error:
    name: Role Error
    type: error
    parent: custom_role
    copy:
      body: "Please enter a valid job title."
    transitions:
      - to: custom_role
        trigger: retry

  select_level:
    name: Experience Level
    type: decision
    handler: src/handlers/onboarding.py:select_level
    copy:
      heading: "What's your experience level?"
    buttons:
      - label: "🌱 Entry Level (0-2 years)"
        goto: select_location
        data: { level: "entry" }
      - label: "🌿 Mid Level (2-5 years)"
        goto: select_location
        data: { level: "mid" }
      - label: "🌳 Senior (5+ years)"
        goto: select_location
        data: { level: "senior" }
      - label: "🎯 Lead/Principal"
        goto: select_location
        data: { level: "lead" }

  select_location:
    name: Work Location
    type: decision
    handler: src/handlers/onboarding.py:select_location
    copy:
      heading: "Where do you want to work?"
    buttons:
      - label: "🌍 Remote Only"
        goto: select_keywords
        data: { location: "remote" }
      - label: "🏢 On-site"
        goto: enter_city
        data: { location: "onsite" }
      - label: "🔀 Hybrid"
        goto: enter_city
        data: { location: "hybrid" }

  enter_city:
    name: Enter City
    type: input
    handler: src/handlers/onboarding.py:enter_city
    copy:
      heading: "Which city?"
      placeholder: "San Francisco, New York, London..."
    validation:
      - type: min_length
        value: 2
        error: "Please enter a city name"
    transitions:
      - to: select_keywords
        trigger: valid_input

  select_keywords:
    name: Keywords
    type: input
    handler: src/handlers/onboarding.py:select_keywords
    copy:
      heading: "Any specific technologies or keywords?"
      body: "Enter comma-separated keywords, or skip."
      placeholder: "Python, React, AWS, startup..."
    buttons:
      - label: "Skip"
        goto: confirm_preferences
    transitions:
      - to: confirm_preferences
        trigger: valid_input

  confirm_preferences:
    name: Confirm Setup
    type: action
    handler: src/handlers/onboarding.py:confirm
    copy:
      heading: "Here's your job alert profile:"
      body: |
        Role: {role}
        Level: {level}
        Location: {location}
        Keywords: {keywords}
    buttons:
      - label: "✅ Looks good!"
        goto: setup_complete
        style: primary
      - label: "🔄 Start over"
        goto: select_role
        style: secondary

  setup_complete:
    name: All Set!
    type: exit
    handler: src/handlers/onboarding.py:complete
    copy:
      heading: "You're all set! 🎉"
      body: |
        I'll send you matching jobs as soon as I find them.

        Use /settings to update your preferences anytime.
    state:
      sets: [onboarding_complete, preferences_saved]
    notes: |
      After this, user enters the main bot flow.
      They'll receive job alerts via the notification system.
```

---

## Checkout Flow

E-commerce checkout example.

```yaml
# checkout.flow
meta:
  name: Checkout
  version: 1.0.0
  description: E-commerce checkout process

nodes:
  cart:
    name: Review Cart
    type: entry
    handler: src/checkout/cart.ts:review
    copy:
      heading: "Your Cart"
      body: "{item_count} items - ${total}"
    buttons:
      - label: "Checkout"
        goto: shipping
        style: primary
      - label: "Continue Shopping"
        goto: exit_to_shop

  shipping:
    name: Shipping Info
    type: input
    handler: src/checkout/shipping.ts:collect
    copy:
      heading: "Where should we ship?"
    validation:
      - type: custom
        error: "Please fill all required fields"
    buttons:
      - label: "← Back"
        goto: cart
    transitions:
      - to: payment
        trigger: valid_input

  payment:
    name: Payment
    type: input
    handler: src/checkout/payment.ts:collect
    copy:
      heading: "Payment Details"
    buttons:
      - label: "← Back"
        goto: shipping
    transitions:
      - to: processing
        trigger: valid_input

  processing:
    name: Processing
    type: action
    handler: src/checkout/payment.ts:process
    copy:
      heading: "Processing payment..."
    transitions:
      - to: confirmation
        condition: payment_success
      - to: payment_error
        condition: payment_failed

  payment_error:
    name: Payment Failed
    type: error
    parent: payment
    copy:
      heading: "Payment Failed"
      body: "{error_message}"
    buttons:
      - label: "Try Again"
        goto: payment
      - label: "Use Different Card"
        goto: payment

  confirmation:
    name: Order Confirmed
    type: exit
    handler: src/checkout/confirmation.ts:show
    copy:
      heading: "Order Confirmed! 🎉"
      body: "Order #{order_id} - We'll email you tracking info."
    state:
      sets: [order_complete]

  exit_to_shop:
    name: Back to Shop
    type: exit
    copy:
      heading: "Returning to shop..."
```

**Renders as:**
```
○ cart
    │
    ├────────────────────▶ ◉ exit_to_shop
    │
    ▼
▭ shipping
    │     │
    │     └──[Back]──▶ (cart)
    ▼
▭ payment
    │     │
    │     └──[Back]──▶ (shipping)
    ▼
□ processing
    │         │
    │[success] │[failed]
    ▼         ▼
◉ confirm  ⚠ error ──▶ (payment)
```
