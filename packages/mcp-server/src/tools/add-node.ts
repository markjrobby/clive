import { resolve } from 'path';
import { writeFile } from 'fs/promises';
import {
  parseFlowFile,
  serializeFlow,
  type FlowNode,
  type NodeType,
} from '@clive/core';

export interface AddNodeParams {
  flow_file: string;
  node_id: string;
  node_config: {
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
    handler?: string;
  };
  connect_from?: string;
  connect_to?: string;
}

export async function addNodeTool(params: AddNodeParams): Promise<string> {
  const filePath = resolve(process.cwd(), params.flow_file);
  const result = await parseFlowFile(filePath);

  if (!result.success) {
    const errors = result.errors?.map((e) => e.message).join(', ') || 'Unknown error';
    throw new Error(`Failed to parse flow file: ${errors}`);
  }

  const flow = result.flow!;

  // Check if node already exists
  if (flow.nodes.has(params.node_id)) {
    throw new Error(`Node "${params.node_id}" already exists`);
  }

  // Create new node
  const newNode: FlowNode = {
    id: params.node_id,
    name: params.node_config.name,
    type: params.node_config.type,
    copy: params.node_config.copy,
    handler: params.node_config.handler,
    buttons: params.node_config.buttons?.map((b) => ({
      label: b.label,
      goto: b.goto,
      style: b.style as 'primary' | 'secondary' | 'danger' | 'link' | undefined,
    })),
    transitions: params.node_config.transitions?.map((t) => ({
      to: t.to,
      trigger: t.trigger,
      condition: t.condition,
    })),
  };

  // Add node to flow
  flow.nodes.set(params.node_id, newNode);

  // Handle connect_from: update source node to point to new node
  if (params.connect_from) {
    const sourceNode = flow.nodes.get(params.connect_from);
    if (!sourceNode) {
      throw new Error(`Source node "${params.connect_from}" not found`);
    }

    // If connect_to is specified, redirect the edge from source to new node
    if (params.connect_to) {
      // Update buttons that point to connect_to
      if (sourceNode.buttons) {
        for (const button of sourceNode.buttons) {
          if (button.goto === params.connect_to) {
            button.goto = params.node_id;
            break; // Only redirect first match
          }
        }
      }

      // Update transitions that point to connect_to
      if (sourceNode.transitions) {
        for (const transition of sourceNode.transitions) {
          if (transition.to === params.connect_to) {
            transition.to = params.node_id;
            break; // Only redirect first match
          }
        }
      }

      // If new node doesn't have explicit transitions, add one to connect_to
      if (!newNode.buttons?.length && !newNode.transitions?.length) {
        newNode.transitions = [{ to: params.connect_to }];
      }
    } else {
      // Just add a transition from source to new node
      if (sourceNode.buttons && sourceNode.buttons.length > 0) {
        // If source has buttons, we don't modify them - the user should specify connect_to
      } else if (sourceNode.transitions) {
        sourceNode.transitions.push({ to: params.node_id });
      } else {
        sourceNode.transitions = [{ to: params.node_id }];
      }
    }
  }

  // Rebuild edges from nodes
  flow.edges = [];
  for (const [id, node] of flow.nodes) {
    if (node.buttons) {
      for (const button of node.buttons) {
        flow.edges.push({
          from: id,
          to: button.goto,
          label: button.label,
        });
      }
    }
    if (node.transitions) {
      for (const transition of node.transitions) {
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

  return `Added node "${params.node_id}" to ${params.flow_file}`;
}
