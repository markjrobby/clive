import { describe, it, expect } from 'vitest';
import { parseFlow } from '../parser/index.js';

describe('parseFlow', () => {
  it('should parse a minimal valid flow', () => {
    const yaml = `
meta:
  name: Simple Flow

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
`;

    const result = parseFlow(yaml);

    expect(result.success).toBe(true);
    expect(result.flow).toBeDefined();
    expect(result.flow!.meta.name).toBe('Simple Flow');
    expect(result.flow!.nodes.size).toBe(2);
    expect(result.flow!.nodes.get('start')?.type).toBe('entry');
    expect(result.flow!.nodes.get('complete')?.type).toBe('exit');
    expect(result.flow!.edges).toHaveLength(1);
    expect(result.flow!.edges[0]).toMatchObject({
      from: 'start',
      to: 'complete',
      label: 'Begin',
    });
  });

  it('should parse all node types', () => {
    const yaml = `
meta:
  name: All Types

nodes:
  entry_node:
    name: Entry
    type: entry
    buttons:
      - label: "Next"
        goto: decision_node

  decision_node:
    name: Decision
    type: decision
    buttons:
      - label: "Option A"
        goto: action_node
      - label: "Option B"
        goto: input_node

  action_node:
    name: Action
    type: action
    transitions:
      - to: exit_node
        trigger: auto

  input_node:
    name: Input
    type: input
    transitions:
      - to: error_node
        trigger: invalid_input
      - to: exit_node
        trigger: valid_input

  error_node:
    name: Error
    type: error
    parent: input_node
    transitions:
      - to: input_node
        trigger: retry

  subprocess_node:
    name: Subprocess
    type: subprocess
    subprocess: ./other.flow
    transitions:
      - to: exit_node
        trigger: auto

  exit_node:
    name: Exit
    type: exit
`;

    const result = parseFlow(yaml);

    expect(result.success).toBe(true);
    expect(result.flow!.nodes.size).toBe(7);

    const types = Array.from(result.flow!.nodes.values()).map((n) => n.type);
    expect(types).toContain('entry');
    expect(types).toContain('exit');
    expect(types).toContain('decision');
    expect(types).toContain('action');
    expect(types).toContain('input');
    expect(types).toContain('error');
    expect(types).toContain('subprocess');
  });

  it('should extract edges from buttons and transitions', () => {
    const yaml = `
meta:
  name: Edge Test

nodes:
  a:
    name: A
    type: entry
    buttons:
      - label: "Go to B"
        goto: b
      - label: "Go to C"
        goto: c

  b:
    name: B
    type: action
    transitions:
      - to: d
        trigger: auto

  c:
    name: C
    type: input
    transitions:
      - to: d
        trigger: valid

  d:
    name: D
    type: exit
`;

    const result = parseFlow(yaml);

    expect(result.success).toBe(true);
    expect(result.flow!.edges).toHaveLength(4);

    const edgeStrings = result.flow!.edges.map((e) => `${e.from}->${e.to}`);
    expect(edgeStrings).toContain('a->b');
    expect(edgeStrings).toContain('a->c');
    expect(edgeStrings).toContain('b->d');
    expect(edgeStrings).toContain('c->d');
  });

  it('should fail on invalid YAML', () => {
    const yaml = `
meta:
  name: Invalid
nodes:
  - this is wrong
`;

    const result = parseFlow(yaml);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('should fail when referencing non-existent nodes', () => {
    const yaml = `
meta:
  name: Bad Reference

nodes:
  start:
    name: Start
    type: entry
    buttons:
      - label: "Go"
        goto: nonexistent
`;

    const result = parseFlow(yaml);

    expect(result.success).toBe(false);
    expect(result.errors?.some((e) => e.message.includes('nonexistent'))).toBe(
      true
    );
  });

  it('should fail when missing entry node', () => {
    const yaml = `
meta:
  name: No Entry

nodes:
  middle:
    name: Middle
    type: action
    transitions:
      - to: end
        trigger: auto

  end:
    name: End
    type: exit
`;

    const result = parseFlow(yaml);

    expect(result.success).toBe(false);
    expect(
      result.errors?.some((e) => e.message.includes('entry node'))
    ).toBe(true);
  });

  it('should parse copy fields', () => {
    const yaml = `
meta:
  name: Copy Test

nodes:
  start:
    name: Welcome
    type: entry
    copy:
      heading: "Welcome to the app!"
      body: "Please follow the instructions below."
    buttons:
      - label: "Continue"
        goto: input

  input:
    name: Enter Email
    type: input
    copy:
      heading: "What's your email?"
      placeholder: "you@example.com"
    transitions:
      - to: done
        trigger: valid

  done:
    name: Done
    type: exit
`;

    const result = parseFlow(yaml);

    expect(result.success).toBe(true);
    expect(result.flow!.nodes.get('start')?.copy?.heading).toBe(
      'Welcome to the app!'
    );
    expect(result.flow!.nodes.get('input')?.copy?.placeholder).toBe(
      'you@example.com'
    );
  });

  it('should parse metadata fields', () => {
    const yaml = `
meta:
  name: Full Meta
  version: 1.2.3
  description: A test flow
  owner: "@testuser"
  tags:
    - onboarding
    - signup

nodes:
  start:
    name: Start
    type: entry
    buttons:
      - label: "Go"
        goto: end

  end:
    name: End
    type: exit
`;

    const result = parseFlow(yaml);

    expect(result.success).toBe(true);
    expect(result.flow!.meta).toMatchObject({
      name: 'Full Meta',
      version: '1.2.3',
      description: 'A test flow',
      owner: '@testuser',
      tags: ['onboarding', 'signup'],
    });
  });
});
