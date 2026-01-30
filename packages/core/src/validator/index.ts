import { ZodError } from 'zod';
import { FlowFileSchema, type FlowFileInput } from './schemas.js';
import type { Flow, FlowNode, Edge, ParseError } from '../types/index.js';

export interface ValidationResult {
  success: boolean;
  flow?: Flow;
  errors?: ParseError[];
}

/**
 * Validate a parsed YAML object against the flow schema
 */
export function validateFlow(data: unknown): ValidationResult {
  try {
    const parsed = FlowFileSchema.parse(data);
    const flow = transformToFlow(parsed);

    // Additional semantic validation
    const semanticErrors = validateSemantics(flow);
    if (semanticErrors.length > 0) {
      return {
        success: false,
        errors: semanticErrors,
      };
    }

    return {
      success: true,
      flow,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => ({
          message: e.message,
          path: e.path.join('.'),
        })),
      };
    }
    throw error;
  }
}

/**
 * Transform validated input to internal Flow structure
 */
function transformToFlow(input: FlowFileInput): Flow {
  const nodes = new Map<string, FlowNode>();
  const edges: Edge[] = [];

  // Transform nodes
  for (const [id, node] of Object.entries(input.nodes)) {
    const flowNode: FlowNode = {
      id,
      name: node.name,
      type: node.type,
      handler: node.handler,
      description: node.description,
      copy: node.copy,
      buttons: node.buttons,
      transitions: node.transitions,
      state: node.state,
      validation: node.validation,
      notes: node.notes,
      subprocess: node.subprocess,
      parent: node.parent,
    };
    nodes.set(id, flowNode);

    // Extract edges from buttons
    if (node.buttons) {
      for (const button of node.buttons) {
        edges.push({
          from: id,
          to: button.goto,
          label: button.label,
          fromButton: button.label,
        });
      }
    }

    // Extract edges from transitions
    if (node.transitions) {
      for (const transition of node.transitions) {
        edges.push({
          from: id,
          to: transition.to,
          label: transition.label,
        });
      }
    }
  }

  // Add explicit edge styles if defined
  if (input.edges) {
    for (const [edgeKey, edgeDef] of Object.entries(input.edges)) {
      const [from, to] = edgeKey.split('->').map((s) => s.trim());
      const existingEdge = edges.find((e) => e.from === from && e.to === to);
      if (existingEdge) {
        existingEdge.style = edgeDef.style;
        existingEdge.color = edgeDef.color;
        if (edgeDef.label) {
          existingEdge.label = edgeDef.label;
        }
      }
    }
  }

  return {
    meta: {
      name: input.meta.name,
      version: input.meta.version,
      description: input.meta.description,
      owner: input.meta.owner,
      tags: input.meta.tags,
    },
    config: input.config,
    imports: input.imports,
    nodes,
    edges,
  };
}

/**
 * Validate semantic rules that can't be expressed in the schema
 */
function validateSemantics(flow: Flow): ParseError[] {
  const errors: ParseError[] = [];

  // Check that all edge targets exist
  for (const edge of flow.edges) {
    if (!flow.nodes.has(edge.to)) {
      errors.push({
        message: `Node "${edge.from}" references non-existent node "${edge.to}"`,
        path: `nodes.${edge.from}`,
      });
    }
  }

  // Check for at least one entry node
  const entryNodes = Array.from(flow.nodes.values()).filter(
    (n) => n.type === 'entry'
  );
  if (entryNodes.length === 0) {
    errors.push({
      message: 'Flow must have at least one entry node',
    });
  }

  // Check error nodes have valid parent
  for (const [id, node] of flow.nodes) {
    if (node.type === 'error' && node.parent) {
      if (!flow.nodes.has(node.parent)) {
        errors.push({
          message: `Error node "${id}" references non-existent parent "${node.parent}"`,
          path: `nodes.${id}.parent`,
        });
      }
    }
  }

  // Check subprocess paths (warning only - file existence checked elsewhere)
  for (const [id, node] of flow.nodes) {
    if (node.type === 'subprocess' && !node.subprocess) {
      errors.push({
        message: `Subprocess node "${id}" missing subprocess path`,
        path: `nodes.${id}`,
      });
    }
  }

  return errors;
}

export { FlowFileSchema, type FlowFileInput } from './schemas.js';
