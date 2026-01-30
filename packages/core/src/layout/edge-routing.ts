import type { Flow, RoutedEdge, Point, PositionedNode } from '../types/index.js';

/**
 * Route edges between positioned nodes.
 * Uses simple vertical connections where possible.
 */
export function routeEdges(
  flow: Flow,
  positionedNodes: PositionedNode[]
): RoutedEdge[] {
  const routedEdges: RoutedEdge[] = [];

  // Create lookup map for positioned nodes
  const nodeMap = new Map<string, PositionedNode>();
  for (const node of positionedNodes) {
    nodeMap.set(node.id, node);
  }

  for (const edge of flow.edges) {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);

    if (!fromNode || !toNode) continue;

    const points = calculateEdgePoints(fromNode, toNode);

    routedEdges.push({
      ...edge,
      points,
    });
  }

  return routedEdges;
}

/**
 * Calculate path points for an edge between two nodes
 */
function calculateEdgePoints(
  from: PositionedNode,
  to: PositionedNode
): Point[] {
  const fromCenterX = from.x + from.width / 2;
  const toCenterX = to.x + to.width / 2;

  const fromBottom = from.y + from.height;
  const fromTop = from.y;
  const toTop = to.y;
  const toBottom = to.y + to.height;

  const points: Point[] = [];

  if (from.layer < to.layer) {
    // Forward edge - go down
    const startY = fromBottom;
    const endY = toTop;
    const midY = Math.floor(startY + (endY - startY) / 2);

    if (Math.abs(fromCenterX - toCenterX) < 2) {
      // Straight down
      points.push({ x: fromCenterX, y: startY });
      points.push({ x: fromCenterX, y: endY });
    } else {
      // Need to route around
      points.push({ x: fromCenterX, y: startY });
      points.push({ x: fromCenterX, y: midY });
      points.push({ x: toCenterX, y: midY });
      points.push({ x: toCenterX, y: endY });
    }
  } else if (from.layer > to.layer) {
    // Back edge - go up (need to route around)
    const startY = fromTop;
    const endY = toBottom;

    // Route to the side first
    const sideX = Math.max(from.x + from.width, to.x + to.width) + 2;
    const topY = Math.min(fromTop, toBottom) - 1;

    points.push({ x: fromCenterX, y: startY });
    points.push({ x: fromCenterX, y: topY });
    points.push({ x: sideX, y: topY });
    points.push({ x: sideX, y: endY });
    points.push({ x: toCenterX, y: endY });
  } else {
    // Same layer - horizontal
    const midY = from.y + from.height / 2;
    if (fromCenterX < toCenterX) {
      points.push({ x: from.x + from.width, y: midY });
      points.push({ x: to.x, y: midY });
    } else {
      points.push({ x: from.x, y: midY });
      points.push({ x: to.x + to.width, y: midY });
    }
  }

  return points;
}

/**
 * Simplify edge points by removing collinear intermediate points
 */
export function simplifyEdgePoints(points: Point[]): Point[] {
  if (points.length <= 2) return points;

  const simplified: Point[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Keep point only if direction changes
    const sameX = prev.x === curr.x && curr.x === next.x;
    const sameY = prev.y === curr.y && curr.y === next.y;

    if (!sameX && !sameY) {
      simplified.push(curr);
    }
  }

  simplified.push(points[points.length - 1]);

  return simplified;
}
