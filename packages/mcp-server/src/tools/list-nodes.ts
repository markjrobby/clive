import { resolve } from 'path';
import { parseFlowFile } from '@clive/core';

export interface ListNodesParams {
  flow_file: string;
}

export interface NodeSummary {
  id: string;
  name: string;
  type: string;
  outgoing: string[];
}

export interface ListNodesResult {
  meta: {
    name: string;
    version?: string;
  };
  nodes: NodeSummary[];
}

export async function listNodesTool(params: ListNodesParams): Promise<ListNodesResult> {
  const filePath = resolve(process.cwd(), params.flow_file);
  const result = await parseFlowFile(filePath);

  if (!result.success) {
    const errors = result.errors?.map((e) => e.message).join(', ') || 'Unknown error';
    throw new Error(`Failed to parse flow file: ${errors}`);
  }

  const flow = result.flow!;
  const nodes: NodeSummary[] = [];

  for (const [id, node] of flow.nodes) {
    const outgoing = flow.edges
      .filter((e) => e.from === id)
      .map((e) => e.to);

    nodes.push({
      id,
      name: node.name,
      type: node.type,
      outgoing: [...new Set(outgoing)],
    });
  }

  return {
    meta: {
      name: flow.meta.name,
      version: flow.meta.version,
    },
    nodes,
  };
}
