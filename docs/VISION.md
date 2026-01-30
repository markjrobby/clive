# Clive: Flow Visualization for Claude Code CLI

**CLI Visual Editor** - Miro in the terminal.

## The Problem

Complex software has invisible architecture. Code is linear, but user flows are graphs.

When building features with conversation flows, multi-step wizards, or state machines:
- Navigation complexity leads to poor UX
- State inconsistencies between transitions
- Copy/text for buttons and messages becomes outdated
- Hard to visualize what needs to change
- Mental model doesn't match the code structure

The traditional solution was drawing flows in Miro/Figma before coding. But with AI-assisted coding (Claude Code), we're trying to shortcut that process by discussing requirements as we "vibe-code". This creates a gap - no persistent visual artifact exists, and the flow lives in your head + scattered across code files.

## The Solution

**Clive is a side-by-side flow visualization tool that runs alongside Claude Code CLI, enabling users to see and manipulate user flows in real-time as they discuss requirements and write code with Claude.**

The core insight: **The diagram is the shared context between human and AI.**

### Key Principles

1. **Framework Agnostic** - The `.flow` file describes user experience, not implementation
2. **The `.flow` File is Documentation** - Human readable, machine parseable, version controlled
3. **Claude Code Native** - MCP integration, Claude understands and can modify flows
4. **Bidirectional** - Generate flow from description, or extract flow from existing code

## Two Entry Points

### Entry Point A: PRD → Flow → Code (Top-Down)

1. User has a PRD or feature idea
2. User + Claude discuss and generate `.flow` file
3. User reviews flow in Clive, makes adjustments
4. Claude generates code that implements the flow
5. Flow and code stay in sync as iteration continues

**Value:** Validate the architecture before writing code. Catch UX issues early.

### Entry Point B: Code → Flow → Refactor (Bottom-Up)

1. User has existing code with implicit flows
2. Clive analyzes code and generates `.flow` file
3. User sees the actual flow (often surprising!)
4. User + Claude discuss improvements on the visual
5. Claude refactors code to match desired flow

**Value:** Make implicit architecture explicit. Understand what you actually built.

## Use Cases

This isn't just for chatbots. It applies to:

- Onboarding flows in any app
- Checkout processes in e-commerce
- Form wizards with conditional steps
- API request chains with branching logic
- State machines in games, hardware, embedded systems
- Approval workflows in enterprise software
- CI/CD pipelines with conditional jobs
- Conversation flows in chatbots (Telegram, Discord, Slack, WhatsApp)
- Navigation flows in mobile apps
- Multi-step CLI tools with branching commands

## Target Users

1. **Solo developers** using Claude Code CLI for complex projects
2. **Product managers** comfortable with Claude Code CLI who want to spec flows visually
3. **Teams** who want shared, version-controlled flow documentation

## What Makes This Different

| Tool | Limitation | Clive Advantage |
|------|-----------|-----------------|
| Miro/Figma | Not in terminal, no code connection | Lives where you code |
| PlantUML | Write-only, no interactivity | Bidirectional, interactive |
| Mermaid | Limited layout, no editing | Smart layout, editable |
| State machine libs | Code-first, hard to visualize | Visualization-first |
| Documentation | Gets stale | Is the source of truth |
