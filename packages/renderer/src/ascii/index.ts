import type { Flow, LayoutResult, LayoutOptions, PositionedNode, RoutedEdge } from '@clive/core';
import { computeLayout } from '@clive/core';
import { Grid } from './grid.js';
import { renderNode } from './node-renderer.js';
import { ARROWS } from './icons.js';

export interface RenderOptions extends LayoutOptions {
  detailed?: boolean;
  padding?: number;
}

/**
 * Render a flow as ASCII art
 */
export function renderFlow(flow: Flow, options: RenderOptions = {}): string[] {
  const layout = computeLayout(flow, options);
  return renderLayout(layout, options);
}

/**
 * Render a pre-computed layout as ASCII art
 */
export function renderLayout(
  layout: LayoutResult,
  options: RenderOptions = {}
): string[] {
  const { padding = 1, detailed = false } = options;

  // Recalculate Y positions to add space for edge rows
  const adjustedNodes: PositionedNode[] = [];
  for (const node of layout.nodes) {
    const adjustedY = padding + node.layer * (node.height + 2); // +2 for edge row
    adjustedNodes.push({
      ...node,
      x: node.x + padding,
      y: adjustedY,
    });
  }

  // Calculate grid dimensions
  let maxX = 0;
  let maxY = 0;
  for (const node of adjustedNodes) {
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  }
  const gridWidth = maxX + padding;
  const gridHeight = maxY + padding + 1;

  const grid = new Grid(gridWidth, gridHeight);

  // Create node position map for edge drawing
  const nodeMap = new Map<string, PositionedNode>();
  for (const node of adjustedNodes) {
    nodeMap.set(node.id, node);
  }

  // Render nodes first
  for (const node of adjustedNodes) {
    renderNode(grid, node, { detailed });
  }

  // Dedupe edges (multiple edges to same target)
  const edgeSet = new Set<string>();
  const uniqueEdges: RoutedEdge[] = [];
  for (const edge of layout.edges) {
    const key = `${edge.from}->${edge.to}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      uniqueEdges.push(edge);
    }
  }

  // Draw edges - process layer by layer for better routing
  for (const edge of uniqueEdges) {
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);
    if (!from || !to) continue;

    // Only draw forward edges (from lower layer to higher layer)
    if (from.layer < to.layer) {
      drawEdge(grid, from, to, adjustedNodes);
    }
  }

  const trimmed = grid.trimRight();
  return trimmed.toLines();
}

/**
 * Draw an edge between two nodes, handling multi-layer spans
 */
function drawEdge(
  grid: Grid,
  from: PositionedNode,
  to: PositionedNode,
  allNodes: PositionedNode[]
): void {
  const fromCenterX = Math.round(from.x + from.width / 2);
  const toCenterX = Math.round(to.x + to.width / 2);
  const layerSpan = to.layer - from.layer;

  // For adjacent layers (span of 1)
  if (layerSpan === 1) {
    drawAdjacentEdge(grid, from, to, fromCenterX, toCenterX);
    return;
  }

  // For multi-layer edges, route along the side to avoid crossing nodes
  // Find a good X position for the vertical routing
  const routeX = findRouteX(from, to, allNodes, fromCenterX, toCenterX);

  // Draw from source down to first routing row
  const startY = from.y + from.height;
  drawVerticalConnector(grid, fromCenterX, startY);

  // If we need to move horizontally to the route column, do it in the first routing row
  if (fromCenterX !== routeX) {
    // Draw horizontal line
    const minX = Math.min(fromCenterX, routeX);
    const maxX = Math.max(fromCenterX, routeX);
    for (let x = minX + 1; x < maxX; x++) {
      const existing = grid.get(x, startY);
      grid.set(x, startY, mergeChars(existing, '─'));
    }
    // Set corners with merging
    if (fromCenterX < routeX) {
      const startExisting = grid.get(fromCenterX, startY);
      grid.set(fromCenterX, startY, mergeChars(startExisting, '└'));
      const endExisting = grid.get(routeX, startY);
      grid.set(routeX, startY, mergeChars(endExisting, '┐'));
    } else {
      const startExisting = grid.get(fromCenterX, startY);
      grid.set(fromCenterX, startY, mergeChars(startExisting, '┘'));
      const endExisting = grid.get(routeX, startY);
      grid.set(routeX, startY, mergeChars(endExisting, '┌'));
    }
  }

  // Draw continuous vertical line from routing start to just above target
  // Start from the row after the horizontal segment (or the start row if no horizontal)
  const vertStartY = startY + 1;
  const vertEndY = to.y - 2; // Stop one row above the target's routing row

  for (let y = vertStartY; y <= vertEndY; y++) {
    const existing = grid.get(routeX, y);
    grid.set(routeX, y, mergeChars(existing, '│'));
  }

  // Connect to target from the route column
  const targetRouteY = to.y - 1;
  if (routeX !== toCenterX) {
    // Draw horizontal segment to target center (excluding endpoints)
    const minX = Math.min(routeX, toCenterX);
    const maxX = Math.max(routeX, toCenterX);
    for (let x = minX + 1; x < maxX; x++) {
      const existing2 = grid.get(x, targetRouteY);
      grid.set(x, targetRouteY, mergeChars(existing2, '─'));
    }

    // Set corner at route position (where vertical meets horizontal - no downward continuation)
    if (routeX < toCenterX) {
      // Coming from above, going right: └
      const cornerExisting = grid.get(routeX, targetRouteY);
      grid.set(routeX, targetRouteY, mergeChars(cornerExisting, '└'));
    } else {
      // Coming from above, going left: ┘
      const cornerExisting = grid.get(routeX, targetRouteY);
      grid.set(routeX, targetRouteY, mergeChars(cornerExisting, '┘'));
    }

    // Set corner at target (where horizontal meets arrow going down)
    if (routeX < toCenterX) {
      // Coming from left, going down: ┐
      const targetCornerExisting = grid.get(toCenterX, targetRouteY);
      grid.set(toCenterX, targetRouteY, mergeChars(targetCornerExisting, '┐'));
    } else {
      // Coming from right, going down: ┌
      const targetCornerExisting = grid.get(toCenterX, targetRouteY);
      grid.set(toCenterX, targetRouteY, mergeChars(targetCornerExisting, '┌'));
    }
  } else {
    // Route and target are aligned - just need vertical connector down
    const existing = grid.get(routeX, targetRouteY);
    grid.set(routeX, targetRouteY, mergeChars(existing, '│'));
  }
}

/**
 * Draw edge between adjacent layers
 */
function drawAdjacentEdge(
  grid: Grid,
  from: PositionedNode,
  to: PositionedNode,
  fromCenterX: number,
  toCenterX: number
): void {
  const edgeRowY = from.y + from.height;

  // Draw vertical connector from source
  drawVerticalConnector(grid, fromCenterX, edgeRowY);

  // If same column, just draw arrow
  if (fromCenterX === toCenterX) {
    grid.set(toCenterX, to.y - 1, ARROWS.down);
    return;
  }

  // Draw horizontal line (without setting corners - let merge handle that)
  const minX = Math.min(fromCenterX, toCenterX);
  const maxX = Math.max(fromCenterX, toCenterX);
  for (let x = minX; x <= maxX; x++) {
    const existing = grid.get(x, edgeRowY);
    grid.set(x, edgeRowY, mergeChars(existing, '─'));
  }

  // Handle the corners/junctions at start and end
  const goingRight = toCenterX > fromCenterX;
  if (goingRight) {
    // At source: we came down and are going right -> └
    const startExisting = grid.get(fromCenterX, edgeRowY);
    grid.set(fromCenterX, edgeRowY, mergeChars(startExisting, '└'));
    // At target: we came from left and are going down -> ┐ or just down connection
    const endExisting = grid.get(toCenterX, edgeRowY);
    grid.set(toCenterX, edgeRowY, mergeChars(endExisting, '┐'));
  } else {
    // At source: we came down and are going left -> ┘
    const startExisting = grid.get(fromCenterX, edgeRowY);
    grid.set(fromCenterX, edgeRowY, mergeChars(startExisting, '┘'));
    // At target: we came from right and are going down -> ┌
    const endExisting = grid.get(toCenterX, edgeRowY);
    grid.set(toCenterX, edgeRowY, mergeChars(endExisting, '┌'));
  }

  // Draw arrow to target
  grid.set(toCenterX, to.y - 1, ARROWS.down);
}

/**
 * Draw a vertical connector at the given position with smart merging
 */
function drawVerticalConnector(grid: Grid, x: number, y: number): void {
  const existing = grid.get(x, y);
  const merged = mergeChars(existing, '│');
  grid.set(x, y, merged);
}

/**
 * Smart merge of box-drawing characters
 */
function mergeChars(existing: string, adding: string): string {
  if (existing === ' ') return adding;
  if (existing === adding) return existing;

  // Special cases for arrows (they have visual direction - arrows always win)
  if (adding === '▼' || adding === '▲' || adding === '◀' || adding === '▶') return adding;
  if (existing === '▼' || existing === '▲' || existing === '◀' || existing === '▶') return existing;

  // Define which directions each character connects to
  const connections: Record<string, { up: boolean; down: boolean; left: boolean; right: boolean }> = {
    '│': { up: true, down: true, left: false, right: false },
    '─': { up: false, down: false, left: true, right: true },
    '┌': { up: false, down: true, left: false, right: true },
    '┐': { up: false, down: true, left: true, right: false },
    '└': { up: true, down: false, left: false, right: true },
    '┘': { up: true, down: false, left: true, right: false },
    '├': { up: true, down: true, left: false, right: true },
    '┤': { up: true, down: true, left: true, right: false },
    '┬': { up: false, down: true, left: true, right: true },
    '┴': { up: true, down: false, left: true, right: true },
    '┼': { up: true, down: true, left: true, right: true },
  };

  const existConn = connections[existing] || { up: false, down: false, left: false, right: false };
  const addConn = connections[adding] || { up: false, down: false, left: false, right: false };

  // Merge connections
  const up = existConn.up || addConn.up;
  const down = existConn.down || addConn.down;
  const left = existConn.left || addConn.left;
  const right = existConn.right || addConn.right;

  // Generate the merged character based on connections
  if (up && down && left && right) return '┼';
  if (up && down && left) return '┤';
  if (up && down && right) return '├';
  if (up && left && right) return '┴';
  if (down && left && right) return '┬';
  if (up && down) return '│';
  if (left && right) return '─';
  if (down && right) return '┌';
  if (down && left) return '┐';
  if (up && right) return '└';
  if (up && left) return '┘';
  if (up || down) return '│';
  if (left || right) return '─';

  return adding;
}
/**
 * Find a good X position for routing a multi-layer edge
 */
function findRouteX(
  from: PositionedNode,
  to: PositionedNode,
  allNodes: PositionedNode[],
  fromCenterX: number,
  toCenterX: number
): number {
  // Find nodes in intermediate layers that might block our path
  const intermediateNodes = allNodes.filter(
    n => n.layer > from.layer && n.layer < to.layer
  );

  // Check if the direct center path is blocked by any intermediate node
  const centerX = Math.round((fromCenterX + toCenterX) / 2);
  let centerBlocked = false;
  for (const node of intermediateNodes) {
    const nodeLeft = node.x;
    const nodeRight = node.x + node.width;
    // Check if centerX would pass through the node
    if (centerX >= nodeLeft && centerX <= nodeRight) {
      centerBlocked = true;
      break;
    }
  }

  // If center is clear, use it
  if (!centerBlocked && intermediateNodes.length === 0) {
    return centerX;
  }

  // If source and target are aligned but there's an intermediate node, route around
  if (intermediateNodes.length > 0) {
    // Find the rightmost extent of all intermediate nodes
    let maxRight = 0;
    for (const node of intermediateNodes) {
      maxRight = Math.max(maxRight, node.x + node.width);
    }
    // Route to the right of all intermediate nodes
    return maxRight + 2;
  }

  // If no intermediates and center is clear, use it
  if (!centerBlocked) {
    return centerX;
  }

  // Otherwise route along the side
  if (toCenterX >= fromCenterX) {
    // Target is to the right or aligned - route on the right
    let rightX = Math.max(fromCenterX, toCenterX) + 2;
    for (const node of intermediateNodes) {
      rightX = Math.max(rightX, node.x + node.width + 2);
    }
    return rightX;
  } else {
    // Target is to the left - route on the left
    let leftX = Math.min(fromCenterX, toCenterX) - 2;
    for (const node of intermediateNodes) {
      leftX = Math.min(leftX, node.x - 2);
    }
    return Math.max(1, leftX);
  }
}

/**
 * Render flow to a single string
 */
export function renderFlowToString(
  flow: Flow,
  options: RenderOptions = {}
): string {
  return renderFlow(flow, options).join('\n');
}

export { Grid } from './grid.js';
export { renderNode, calculateNodeWidth } from './node-renderer.js';
export { renderEdge, renderEdges } from './edge-renderer.js';
export { NODE_ICONS, BOX, ARROWS, EDGE } from './icons.js';
