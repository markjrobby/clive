import { describe, it, expect } from 'vitest';
import { parseFlow } from '../parser/index.js';
import { computeLayout, assignLayers, getNodesByLayer } from '../layout/index.js';

describe('layout', () => {
  describe('assignLayers', () => {
    it('should assign entry nodes to layer 0', () => {
      const yaml = `
meta:
  name: Test

nodes:
  start:
    name: Start
    type: entry
    buttons:
      - label: "Next"
        goto: step1

  step1:
    name: Step 1
    type: action
    transitions:
      - to: end
        trigger: auto

  end:
    name: End
    type: exit
`;

      const result = parseFlow(yaml);
      expect(result.success).toBe(true);

      const assignment = assignLayers(result.flow!);

      expect(assignment.nodeLayers.get('start')).toBe(0);
      expect(assignment.nodeLayers.get('step1')).toBe(1);
      expect(assignment.nodeLayers.get('end')).toBe(2);
      expect(assignment.layerCount).toBe(3);
    });

    it('should handle branching paths', () => {
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
    name: Branch A
    type: action
    transitions:
      - to: end
        trigger: auto

  branch_b:
    name: Branch B
    type: action
    transitions:
      - to: end
        trigger: auto

  end:
    name: End
    type: exit
`;

      const result = parseFlow(yaml);
      expect(result.success).toBe(true);

      const assignment = assignLayers(result.flow!);

      expect(assignment.nodeLayers.get('start')).toBe(0);
      expect(assignment.nodeLayers.get('branch_a')).toBe(1);
      expect(assignment.nodeLayers.get('branch_b')).toBe(1);
      expect(assignment.nodeLayers.get('end')).toBe(2);
    });

    it('should handle diamond patterns', () => {
      const yaml = `
meta:
  name: Diamond

nodes:
  start:
    name: Start
    type: entry
    buttons:
      - label: "A"
        goto: left
      - label: "B"
        goto: right

  left:
    name: Left
    type: action
    transitions:
      - to: merge
        trigger: auto

  right:
    name: Right
    type: action
    transitions:
      - to: merge
        trigger: auto

  merge:
    name: Merge
    type: action
    transitions:
      - to: end
        trigger: auto

  end:
    name: End
    type: exit
`;

      const result = parseFlow(yaml);
      expect(result.success).toBe(true);

      const assignment = assignLayers(result.flow!);

      expect(assignment.nodeLayers.get('start')).toBe(0);
      expect(assignment.nodeLayers.get('left')).toBe(1);
      expect(assignment.nodeLayers.get('right')).toBe(1);
      expect(assignment.nodeLayers.get('merge')).toBe(2);
      expect(assignment.nodeLayers.get('end')).toBe(3);
    });
  });

  describe('getNodesByLayer', () => {
    it('should group nodes by layer', () => {
      const yaml = `
meta:
  name: Test

nodes:
  start:
    name: Start
    type: entry
    buttons:
      - label: "A"
        goto: a
      - label: "B"
        goto: b

  a:
    name: A
    type: action
    transitions:
      - to: end
        trigger: auto

  b:
    name: B
    type: action
    transitions:
      - to: end
        trigger: auto

  end:
    name: End
    type: exit
`;

      const result = parseFlow(yaml);
      expect(result.success).toBe(true);

      const assignment = assignLayers(result.flow!);
      const layers = getNodesByLayer(result.flow!, assignment);

      expect(layers.get(0)).toContain('start');
      expect(layers.get(1)).toContain('a');
      expect(layers.get(1)).toContain('b');
      expect(layers.get(2)).toContain('end');
    });
  });

  describe('computeLayout', () => {
    it('should compute complete layout', () => {
      const yaml = `
meta:
  name: Test

nodes:
  start:
    name: Start
    type: entry
    buttons:
      - label: "Next"
        goto: end

  end:
    name: End
    type: exit
`;

      const result = parseFlow(yaml);
      expect(result.success).toBe(true);

      const layout = computeLayout(result.flow!);

      expect(layout.nodes).toHaveLength(2);
      expect(layout.edges).toHaveLength(1);
      expect(layout.layers).toBe(2);
      expect(layout.width).toBeGreaterThan(0);
      expect(layout.height).toBeGreaterThan(0);

      // Check nodes have positions
      for (const node of layout.nodes) {
        expect(typeof node.x).toBe('number');
        expect(typeof node.y).toBe('number');
        expect(node.width).toBeGreaterThan(0);
        expect(node.height).toBeGreaterThan(0);
      }

      // Check edges have points
      for (const edge of layout.edges) {
        expect(edge.points.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should respect layout options', () => {
      const yaml = `
meta:
  name: Test

nodes:
  start:
    name: Start
    type: entry
    buttons:
      - label: "Next"
        goto: end

  end:
    name: End
    type: exit
`;

      const result = parseFlow(yaml);
      expect(result.success).toBe(true);

      const layout1 = computeLayout(result.flow!, {
        nodeWidth: 20,
        horizontalSpacing: 4,
      });

      const layout2 = computeLayout(result.flow!, {
        nodeWidth: 30,
        horizontalSpacing: 10,
      });

      // Wider nodes should result in wider layout
      expect(layout2.width).toBeGreaterThanOrEqual(layout1.width);
    });
  });
});
