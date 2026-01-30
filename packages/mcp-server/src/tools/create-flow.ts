import { resolve, dirname } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { serializeFlow, type Flow, type FlowNode, type NodeType } from '@clive/core';

export interface CreateFlowParams {
  output_path: string;
  name: string;
  description?: string;
  version?: string;
  nodes: Array<{
    id: string;
    name: string;
    type: NodeType;
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
  }>;
}

export async function createFlowTool(params: CreateFlowParams): Promise<string> {
  const filePath = resolve(process.cwd(), params.output_path);

  // Create nodes map
  const nodes = new Map<string, FlowNode>();
  const edges: Array<{ from: string; to: string; label?: string }> = [];

  for (const nodeInput of params.nodes) {
    const node: FlowNode = {
      id: nodeInput.id,
      name: nodeInput.name,
      type: nodeInput.type,
      copy: nodeInput.copy,
      buttons: nodeInput.buttons?.map((b) => ({
        label: b.label,
        goto: b.goto,
        style: b.style as 'primary' | 'secondary' | 'danger' | 'link' | undefined,
      })),
      transitions: nodeInput.transitions?.map((t) => ({
        to: t.to,
        trigger: t.trigger,
        condition: t.condition,
      })),
    };

    nodes.set(nodeInput.id, node);

    // Extract edges
    if (nodeInput.buttons) {
      for (const button of nodeInput.buttons) {
        edges.push({
          from: nodeInput.id,
          to: button.goto,
          label: button.label,
        });
      }
    }

    if (nodeInput.transitions) {
      for (const transition of nodeInput.transitions) {
        edges.push({
          from: nodeInput.id,
          to: transition.to,
        });
      }
    }
  }

  const flow: Flow = {
    meta: {
      name: params.name,
      description: params.description,
      version: params.version || '1.0.0',
    },
    nodes,
    edges,
  };

  // Serialize to YAML
  const yaml = serializeFlow(flow);

  // Ensure directory exists
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });

  // Write file
  await writeFile(filePath, yaml, 'utf-8');

  return `Created flow at ${params.output_path}`;
}
