import { parse as parseYaml, YAMLParseError } from 'yaml';
import { validateFlow } from '../validator/index.js';
import type { Flow, ParseResult } from '../types/index.js';

/**
 * Parse a .flow file content (YAML string) into a Flow structure
 */
export function parseFlow(content: string): ParseResult {
  try {
    // Parse YAML
    const data = parseYaml(content);

    if (!data || typeof data !== 'object') {
      return {
        success: false,
        errors: [{ message: 'Invalid YAML: expected an object' }],
      };
    }

    // Validate and transform
    const result = validateFlow(data);

    if (!result.success) {
      return {
        success: false,
        errors: result.errors,
      };
    }

    return {
      success: true,
      flow: result.flow,
    };
  } catch (error) {
    if (error instanceof YAMLParseError) {
      return {
        success: false,
        errors: [
          {
            message: error.message,
            line: error.linePos?.[0]?.line,
            column: error.linePos?.[0]?.col,
          },
        ],
      };
    }

    return {
      success: false,
      errors: [
        {
          message: error instanceof Error ? error.message : 'Unknown parse error',
        },
      ],
    };
  }
}

/**
 * Parse a flow from a file path
 */
export async function parseFlowFile(filePath: string): Promise<ParseResult> {
  const fs = await import('fs/promises');

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return parseFlow(content);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return {
        success: false,
        errors: [{ message: `File not found: ${filePath}` }],
      };
    }

    return {
      success: false,
      errors: [
        {
          message:
            error instanceof Error ? error.message : 'Failed to read file',
        },
      ],
    };
  }
}

/**
 * Serialize a Flow back to YAML string
 */
export function serializeFlow(flow: Flow): string {
  const { stringify } = require('yaml') as typeof import('yaml');

  // Convert Map to plain object for YAML serialization
  const nodes: Record<string, Omit<import('../types/index.js').FlowNode, 'id'>> = {};

  for (const [id, node] of flow.nodes) {
    const { id: _id, ...nodeWithoutId } = node;
    nodes[id] = nodeWithoutId;
  }

  const output: Record<string, unknown> = {
    meta: flow.meta,
  };

  if (flow.config) {
    output.config = flow.config;
  }

  if (flow.imports && flow.imports.length > 0) {
    output.imports = flow.imports;
  }

  output.nodes = nodes;

  return stringify(output, { lineWidth: 0 });
}
