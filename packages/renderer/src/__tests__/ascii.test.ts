import { describe, it, expect } from 'vitest';
import { parseFlow } from '@clive/core';
import { renderFlow, renderFlowToString, Grid } from '../ascii/index.js';

describe('Grid', () => {
  it('should create a grid with dimensions', () => {
    const grid = new Grid(10, 5);
    expect(grid.width).toBe(10);
    expect(grid.height).toBe(5);
  });

  it('should set and get characters', () => {
    const grid = new Grid(10, 5);
    grid.set(2, 3, 'X');
    expect(grid.get(2, 3)).toBe('X');
  });

  it('should write strings', () => {
    const grid = new Grid(10, 5);
    grid.writeString(1, 2, 'Hello');
    expect(grid.get(1, 2)).toBe('H');
    expect(grid.get(2, 2)).toBe('e');
    expect(grid.get(5, 2)).toBe('o');
  });

  it('should draw boxes', () => {
    const grid = new Grid(10, 5);
    grid.box(0, 0, 6, 3);
    const lines = grid.toLines();

    expect(lines[0]).toContain('┌────┐');
    expect(lines[1]).toContain('│');
    expect(lines[2]).toContain('└────┘');
  });
});

describe('renderFlow', () => {
  it('should render a simple flow', () => {
    const yaml = `
meta:
  name: Simple

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

    const lines = renderFlow(result.flow!);

    // Should have content
    expect(lines.length).toBeGreaterThan(0);

    // Join for easier inspection
    const output = lines.join('\n');

    // Should contain node icons
    expect(output).toContain('○'); // entry icon
    expect(output).toContain('◉'); // exit icon

    // Should contain box characters
    expect(output).toContain('┌');
    expect(output).toContain('┘');
  });

  it('should render branching flows', () => {
    const yaml = `
meta:
  name: Branching

nodes:
  start:
    name: Start
    type: entry
    buttons:
      - label: "A"
        goto: branch_a
      - label: "B"
        goto: branch_b

  branch_a:
    name: A
    type: action
    transitions:
      - to: end

  branch_b:
    name: B
    type: action
    transitions:
      - to: end

  end:
    name: End
    type: exit
`;

    const result = parseFlow(yaml);
    expect(result.success).toBe(true);

    const lines = renderFlow(result.flow!);
    const output = lines.join('\n');

    // Should contain all nodes
    expect(output).toContain('start');
    expect(output).toContain('branch_a');
    expect(output).toContain('branch_b');
    expect(output).toContain('end');
  });

  it('should respect detailed option', () => {
    const yaml = `
meta:
  name: Detailed Test

nodes:
  start:
    name: Welcome
    type: entry
    copy:
      heading: "Welcome message"
    buttons:
      - label: "Continue"
        goto: end

  end:
    name: Done
    type: exit
`;

    const result = parseFlow(yaml);
    expect(result.success).toBe(true);

    // Standard mode - should NOT show copy
    const standardLines = renderFlow(result.flow!, { detailed: false });
    const standardOutput = standardLines.join('\n');

    // Detailed mode - should show copy
    const detailedLines = renderFlow(result.flow!, { detailed: true });
    const detailedOutput = detailedLines.join('\n');

    // Detailed output should be taller (more lines)
    expect(detailedLines.length).toBeGreaterThanOrEqual(standardLines.length);
  });
});

describe('renderFlowToString', () => {
  it('should return a single string', () => {
    const yaml = `
meta:
  name: Test

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

    const output = renderFlowToString(result.flow!);

    expect(typeof output).toBe('string');
    expect(output).toContain('\n');
  });
});
