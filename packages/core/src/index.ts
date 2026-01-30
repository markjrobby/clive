/**
 * @clive/core - Core parser, validator, and layout engine for Clive
 */

// Types
export * from './types/index.js';

// Parser
export { parseFlow, parseFlowFile, serializeFlow } from './parser/index.js';

// Validator
export { validateFlow, FlowFileSchema } from './validator/index.js';
export type { ValidationResult } from './validator/index.js';
export type { FlowFileInput, NodeInput } from './validator/schemas.js';

// Layout
export {
  computeLayout,
  assignLayers,
  getNodesByLayer,
  minimizeCrossings,
  countCrossings,
  assignCoordinates,
  centerNodes,
  routeEdges,
  simplifyEdgePoints,
  DEFAULT_LAYOUT_OPTIONS,
} from './layout/index.js';
