import type { Flow, PositionedNode, LayoutOptions } from '../types/index.js';
import type { LayerAssignment } from './layer-assignment.js';
import type { LayerOrdering } from './crossing-minimization.js';

/**
 * Default layout options
 */
export const DEFAULT_LAYOUT_OPTIONS: Required<LayoutOptions> = {
  direction: 'TB',
  nodeWidth: 20,
  nodeHeight: 3,
  horizontalSpacing: 4,
  verticalSpacing: 2,
  detailed: false,
};

/**
 * Result of coordinate assignment
 */
export interface CoordinateAssignment {
  nodes: PositionedNode[];
  width: number;
  height: number;
}

/**
 * Assign x,y coordinates to nodes based on layer and order
 */
export function assignCoordinates(
  flow: Flow,
  _assignment: LayerAssignment,
  ordering: LayerOrdering,
  options: LayoutOptions = {}
): CoordinateAssignment {
  const opts = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  const { nodeWidth, nodeHeight, horizontalSpacing, verticalSpacing, direction } =
    opts;

  const positionedNodes: PositionedNode[] = [];
  let maxWidth = 0;
  let maxHeight = 0;

  // Calculate node dimensions based on detailed mode
  const actualNodeHeight = opts.detailed ? nodeHeight + 2 : nodeHeight;

  for (const [layer, nodeIds] of ordering.order) {
    for (let order = 0; order < nodeIds.length; order++) {
      const nodeId = nodeIds[order];
      const node = flow.nodes.get(nodeId);

      if (!node) continue;

      let x: number;
      let y: number;

      if (direction === 'TB') {
        // Top to bottom layout
        x = order * (nodeWidth + horizontalSpacing);
        y = layer * (actualNodeHeight + verticalSpacing);
      } else {
        // Left to right layout
        x = layer * (nodeWidth + horizontalSpacing);
        y = order * (actualNodeHeight + verticalSpacing);
      }

      const positionedNode: PositionedNode = {
        ...node,
        x,
        y,
        width: nodeWidth,
        height: actualNodeHeight,
        layer,
        order,
      };

      positionedNodes.push(positionedNode);

      // Track dimensions
      maxWidth = Math.max(maxWidth, x + nodeWidth);
      maxHeight = Math.max(maxHeight, y + actualNodeHeight);
    }
  }

  return {
    nodes: positionedNodes,
    width: maxWidth,
    height: maxHeight,
  };
}

/**
 * Center nodes within their layers to improve visual balance
 */
export function centerNodes(
  assignment: CoordinateAssignment,
  options: LayoutOptions = {}
): CoordinateAssignment {
  const opts = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  const { nodeWidth, horizontalSpacing, direction } = opts;

  // Group nodes by layer
  const layers = new Map<number, PositionedNode[]>();
  for (const node of assignment.nodes) {
    if (!layers.has(node.layer)) {
      layers.set(node.layer, []);
    }
    layers.get(node.layer)!.push(node);
  }

  // Find max layer width
  let maxLayerWidth = 0;
  for (const nodes of layers.values()) {
    const layerWidth = nodes.length * (nodeWidth + horizontalSpacing) - horizontalSpacing;
    maxLayerWidth = Math.max(maxLayerWidth, layerWidth);
  }

  // Center each layer
  const centeredNodes: PositionedNode[] = [];

  for (const [, nodes] of layers) {
    const layerWidth = nodes.length * (nodeWidth + horizontalSpacing) - horizontalSpacing;
    const offset = (maxLayerWidth - layerWidth) / 2;

    for (const node of nodes) {
      if (direction === 'TB') {
        centeredNodes.push({
          ...node,
          x: node.x + offset,
        });
      } else {
        centeredNodes.push({
          ...node,
          y: node.y + offset,
        });
      }
    }
  }

  return {
    nodes: centeredNodes,
    width: maxLayerWidth,
    height: assignment.height,
  };
}
