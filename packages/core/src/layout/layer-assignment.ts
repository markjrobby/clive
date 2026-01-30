import type { Flow } from '../types/index.js';

/**
 * Result of layer assignment
 */
export interface LayerAssignment {
  nodeLayers: Map<string, number>;
  layerCount: number;
  backEdges: Set<string>;
}

/**
 * Assign nodes to layers using BFS from entry nodes.
 * This places nodes as close to entry as possible while respecting edge directions.
 * Handles cycles by detecting back edges using DFS.
 */
export function assignLayers(flow: Flow): LayerAssignment {
  const nodeLayers = new Map<string, number>();
  const nodes = flow.nodes;
  const edges = flow.edges;
  const backEdges = new Set<string>();

  // Build adjacency lists (dedupe edges)
  const outgoing = new Map<string, Set<string>>();
  const incoming = new Map<string, Set<string>>();
  for (const nodeId of nodes.keys()) {
    outgoing.set(nodeId, new Set());
    incoming.set(nodeId, new Set());
  }
  for (const edge of edges) {
    if (nodes.has(edge.from) && nodes.has(edge.to) && edge.from !== edge.to) {
      outgoing.get(edge.from)!.add(edge.to);
      incoming.get(edge.to)!.add(edge.from);
    }
  }

  // Find entry nodes (type === 'entry')
  const entryNodes: string[] = [];
  for (const [id, node] of nodes) {
    if (node.type === 'entry') {
      entryNodes.push(id);
    }
  }

  // Fallback: nodes with no incoming edges, or first node
  if (entryNodes.length === 0) {
    for (const [id] of nodes) {
      if (incoming.get(id)!.size === 0) {
        entryNodes.push(id);
      }
    }
  }
  if (entryNodes.length === 0 && nodes.size > 0) {
    entryNodes.push(nodes.keys().next().value!);
  }

  // First, detect back edges using DFS (edges that create cycles)
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function detectBackEdges(nodeId: string): void {
    visited.add(nodeId);
    inStack.add(nodeId);

    for (const neighbor of outgoing.get(nodeId) || []) {
      if (inStack.has(neighbor)) {
        // Back edge detected (creates a cycle)
        backEdges.add(`${nodeId}->${neighbor}`);
      } else if (!visited.has(neighbor)) {
        detectBackEdges(neighbor);
      }
    }

    inStack.delete(nodeId);
  }

  for (const entry of entryNodes) {
    if (!visited.has(entry)) {
      detectBackEdges(entry);
    }
  }
  // Also check disconnected nodes
  for (const nodeId of nodes.keys()) {
    if (!visited.has(nodeId)) {
      detectBackEdges(nodeId);
    }
  }

  // Build forward-only adjacency (excluding back edges)
  const forwardOutgoing = new Map<string, Set<string>>();
  const forwardIncoming = new Map<string, Set<string>>();
  for (const nodeId of nodes.keys()) {
    forwardOutgoing.set(nodeId, new Set());
    forwardIncoming.set(nodeId, new Set());
  }
  for (const edge of edges) {
    const edgeKey = `${edge.from}->${edge.to}`;
    if (nodes.has(edge.from) && nodes.has(edge.to) &&
        edge.from !== edge.to && !backEdges.has(edgeKey)) {
      forwardOutgoing.get(edge.from)!.add(edge.to);
      forwardIncoming.get(edge.to)!.add(edge.from);
    }
  }

  // Use longest path algorithm with topological sort (Kahn's algorithm)
  // This ensures nodes are placed at the maximum distance from entry
  // so that convergent paths don't cause layout issues
  for (const nodeId of nodes.keys()) {
    nodeLayers.set(nodeId, 0);
  }

  const inDegree = new Map<string, number>();
  for (const nodeId of nodes.keys()) {
    inDegree.set(nodeId, forwardIncoming.get(nodeId)!.size);
  }

  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const currentLayer = nodeLayers.get(nodeId)!;

    for (const neighbor of forwardOutgoing.get(nodeId) || []) {
      // Update to max layer (longest path)
      const newLayer = currentLayer + 1;
      if (newLayer > nodeLayers.get(neighbor)!) {
        nodeLayers.set(neighbor, newLayer);
      }

      // Decrement in-degree
      const newDegree = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Handle disconnected nodes
  for (const nodeId of nodes.keys()) {
    if (!nodeLayers.has(nodeId)) {
      nodeLayers.set(nodeId, 0);
    }
  }

  // Calculate layer count
  let maxLayer = 0;
  for (const layer of nodeLayers.values()) {
    maxLayer = Math.max(maxLayer, layer);
  }

  return {
    nodeLayers,
    layerCount: maxLayer + 1,
    backEdges,
  };
}

/**
 * Get nodes grouped by layer
 */
export function getNodesByLayer(
  _flow: Flow,
  assignment: LayerAssignment
): Map<number, string[]> {
  const layers = new Map<number, string[]>();

  for (let i = 0; i < assignment.layerCount; i++) {
    layers.set(i, []);
  }

  for (const [nodeId, layer] of assignment.nodeLayers) {
    layers.get(layer)!.push(nodeId);
  }

  return layers;
}
