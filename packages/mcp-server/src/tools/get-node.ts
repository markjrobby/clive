import { resolve } from 'path';
import { parseFlowFile } from '@clive/core';

export interface GetNodeParams {
  flow_file: string;
  node_id: string;
}

export interface NodeInfo {
  id: string;
  name: string;
  type: string;
  handler?: string;
  description?: string;
  copy?: {
    heading?: string;
    body?: string;
    placeholder?: string;
  };
  buttons?: Array<{
    label: string;
    goto: string;
    style?: string;
  }>;
  transitions?: Array<{
    to: string;
    trigger?: string;
    condition?: string;
  }>;
  incoming_edges: string[];
  outgoing_edges: string[];
}

export async function getNodeTool(params: GetNodeParams): Promise<NodeInfo> {
  const filePath = resolve(process.cwd(), params.flow_file);
  const result = await parseFlowFile(filePath);

  if (!result.success) {
    const errors = result.errors?.map((e) => e.message).join(', ') || 'Unknown error';
    throw new Error(`Failed to parse flow file: ${errors}`);
  }

  const node = result.flow!.nodes.get(params.node_id);

  if (!node) {
    throw new Error(`Node "${params.node_id}" not found in flow`);
  }

  // Find incoming and outgoing edges
  const incomingEdges = result.flow!.edges
    .filter((e) => e.to === params.node_id)
    .map((e) => e.from);

  const outgoingEdges = result.flow!.edges
    .filter((e) => e.from === params.node_id)
    .map((e) => e.to);

  return {
    id: node.id,
    name: node.name,
    type: node.type,
    handler: node.handler,
    description: node.description,
    copy: node.copy,
    buttons: node.buttons?.map((b) => ({
      label: b.label,
      goto: b.goto,
      style: b.style,
    })),
    transitions: node.transitions?.map((t) => ({
      to: t.to,
      trigger: t.trigger,
      condition: t.condition,
    })),
    incoming_edges: incomingEdges,
    outgoing_edges: [...new Set(outgoingEdges)],
  };
}
