import type { Flow, LayoutResult, LayoutOptions } from '../types/index.js';
import { assignLayers } from './layer-assignment.js';
import { minimizeCrossings } from './crossing-minimization.js';
import {
  assignCoordinates,
  centerNodes,
} from './coordinate-assignment.js';
import { routeEdges, simplifyEdgePoints } from './edge-routing.js';

export { assignLayers, getNodesByLayer } from './layer-assignment.js';
export { minimizeCrossings, countCrossings } from './crossing-minimization.js';
export {
  assignCoordinates,
  centerNodes,
  DEFAULT_LAYOUT_OPTIONS,
} from './coordinate-assignment.js';
export { routeEdges, simplifyEdgePoints } from './edge-routing.js';

/**
 * Compute complete layout for a flow
 * This is the main entry point for the layout engine
 */
export function computeLayout(
  flow: Flow,
  options: LayoutOptions = {}
): LayoutResult {
  // Step 1: Assign nodes to layers
  const layerAssignment = assignLayers(flow);

  // Step 2: Minimize edge crossings
  const ordering = minimizeCrossings(flow, layerAssignment);

  // Step 3: Assign coordinates
  const coordinates = assignCoordinates(flow, layerAssignment, ordering, options);

  // Step 4: Center nodes within layers
  const centered = centerNodes(coordinates, options);

  // Step 5: Route edges
  const routedEdges = routeEdges(flow, centered.nodes);

  // Simplify edge points
  for (const edge of routedEdges) {
    edge.points = simplifyEdgePoints(edge.points);
  }

  return {
    nodes: centered.nodes,
    edges: routedEdges,
    width: centered.width,
    height: centered.height,
    layers: layerAssignment.layerCount,
  };
}
