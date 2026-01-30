import { resolve } from 'path';
import { writeFile } from 'fs/promises';
import { parseFlowFile, serializeFlow } from '@clive/core';

export interface UpdateNodeParams {
  flow_file: string;
  node_id: string;
  updates: {
    name?: string;
    type?: string;
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
    handler?: string;
  };
}

export async function updateNodeTool(params: UpdateNodeParams): Promise<string> {
  const filePath = resolve(process.cwd(), params.flow_file);
  const result = await parseFlowFile(filePath);

  if (!result.success) {
    const errors = result.errors?.map((e) => e.message).join(', ') || 'Unknown error';
    throw new Error(`Failed to parse flow file: ${errors}`);
  }

  const flow = result.flow!;
  const node = flow.nodes.get(params.node_id);

  if (!node) {
    throw new Error(`Node "${params.node_id}" not found`);
  }

  // Apply updates
  if (params.updates.name !== undefined) {
    node.name = params.updates.name;
  }

  if (params.updates.type !== undefined) {
    node.type = params.updates.type as typeof node.type;
  }

  if (params.updates.handler !== undefined) {
    node.handler = params.updates.handler;
  }

  if (params.updates.copy !== undefined) {
    // Merge copy updates
    node.copy = {
      ...node.copy,
      ...params.updates.copy,
    };
  }

  if (params.updates.buttons !== undefined) {
    node.buttons = params.updates.buttons.map((b) => ({
      label: b.label,
      goto: b.goto,
      style: b.style as 'primary' | 'secondary' | 'danger' | 'link' | undefined,
    }));
  }

  if (params.updates.transitions !== undefined) {
    node.transitions = params.updates.transitions.map((t) => ({
      to: t.to,
      trigger: t.trigger,
      condition: t.condition,
    }));
  }

  // Rebuild edges from nodes
  flow.edges = [];
  for (const [id, n] of flow.nodes) {
    if (n.buttons) {
      for (const button of n.buttons) {
        flow.edges.push({
          from: id,
          to: button.goto,
          label: button.label,
        });
      }
    }
    if (n.transitions) {
      for (const transition of n.transitions) {
        flow.edges.push({
          from: id,
          to: transition.to,
          label: transition.label,
        });
      }
    }
  }

  // Serialize and save
  const yaml = serializeFlow(flow);
  await writeFile(filePath, yaml, 'utf-8');

  return `Updated node "${params.node_id}" in ${params.flow_file}`;
}
