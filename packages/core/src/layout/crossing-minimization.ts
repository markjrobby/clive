import type { Flow, Edge } from '../types/index.js';
import type { LayerAssignment } from './layer-assignment.js';

/**
 * Result of crossing minimization - node order within each layer
 */
export interface LayerOrdering {
  order: Map<number, string[]>;
}

/**
 * Minimize edge crossings using barycenter method
 * Orders nodes within each layer to reduce edge crossings
 */
export function minimizeCrossings(
  flow: Flow,
  assignment: LayerAssignment
): LayerOrdering {
  const { nodeLayers, layerCount } = assignment;

  // Build adjacency lists
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  for (const nodeId of flow.nodes.keys()) {
    outgoing.set(nodeId, []);
    incoming.set(nodeId, []);
  }

  for (const edge of flow.edges) {
    if (flow.nodes.has(edge.from) && flow.nodes.has(edge.to)) {
      outgoing.get(edge.from)!.push(edge.to);
      incoming.get(edge.to)!.push(edge.from);
    }
  }

  // Initialize layers with nodes
  const layers = new Map<number, string[]>();
  for (let i = 0; i < layerCount; i++) {
    layers.set(i, []);
  }

  for (const [nodeId, layer] of nodeLayers) {
    layers.get(layer)!.push(nodeId);
  }

  // Sort initial layers alphabetically for consistency
  for (const [, nodes] of layers) {
    nodes.sort();
  }

  // Apply barycenter heuristic - multiple passes
  const maxIterations = 4;

  for (let iter = 0; iter < maxIterations; iter++) {
    // Forward pass (top to bottom)
    for (let layer = 1; layer < layerCount; layer++) {
      const prevLayer = layers.get(layer - 1)!;
      const currentLayer = layers.get(layer)!;

      orderByBarycenter(currentLayer, prevLayer, incoming, nodeLayers);
    }

    // Backward pass (bottom to top)
    for (let layer = layerCount - 2; layer >= 0; layer--) {
      const nextLayer = layers.get(layer + 1)!;
      const currentLayer = layers.get(layer)!;

      orderByBarycenter(currentLayer, nextLayer, outgoing, nodeLayers);
    }
  }

  return { order: layers };
}

/**
 * Order nodes by barycenter (average position of connected nodes in adjacent layer)
 */
function orderByBarycenter(
  layer: string[],
  adjacentLayer: string[],
  connections: Map<string, string[]>,
  _nodeLayers: Map<string, number>
): void {
  // Create position map for adjacent layer
  const positionMap = new Map<string, number>();
  adjacentLayer.forEach((nodeId, index) => {
    positionMap.set(nodeId, index);
  });

  // Calculate barycenter for each node
  const barycenters = new Map<string, number>();

  for (const nodeId of layer) {
    const connectedNodes = connections.get(nodeId) || [];
    const connectedInAdjacent = connectedNodes.filter((n) =>
      positionMap.has(n)
    );

    if (connectedInAdjacent.length === 0) {
      // Keep original position if no connections
      barycenters.set(nodeId, layer.indexOf(nodeId));
    } else {
      // Average position of connected nodes
      const sum = connectedInAdjacent.reduce(
        (acc, n) => acc + positionMap.get(n)!,
        0
      );
      barycenters.set(nodeId, sum / connectedInAdjacent.length);
    }
  }

  // Sort by barycenter
  layer.sort((a, b) => {
    const baryA = barycenters.get(a)!;
    const baryB = barycenters.get(b)!;

    if (baryA !== baryB) {
      return baryA - baryB;
    }

    // Tie-breaker: alphabetical
    return a.localeCompare(b);
  });
}

/**
 * Count edge crossings between two adjacent layers
 */
export function countCrossings(
  layer1: string[],
  layer2: string[],
  edges: Edge[]
): number {
  let crossings = 0;

  // Get position maps
  const pos1 = new Map<string, number>();
  const pos2 = new Map<string, number>();

  layer1.forEach((n, i) => pos1.set(n, i));
  layer2.forEach((n, i) => pos2.set(n, i));

  // Find edges between the two layers
  const relevantEdges = edges.filter(
    (e) => pos1.has(e.from) && pos2.has(e.to)
  );

  // Count crossings
  for (let i = 0; i < relevantEdges.length; i++) {
    for (let j = i + 1; j < relevantEdges.length; j++) {
      const e1 = relevantEdges[i];
      const e2 = relevantEdges[j];

      const x1 = pos1.get(e1.from)!;
      const y1 = pos2.get(e1.to)!;
      const x2 = pos1.get(e2.from)!;
      const y2 = pos2.get(e2.to)!;

      // Edges cross if their orderings differ
      if ((x1 < x2 && y1 > y2) || (x1 > x2 && y1 < y2)) {
        crossings++;
      }
    }
  }

  return crossings;
}
