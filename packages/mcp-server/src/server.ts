import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  renderFlowTool,
  getNodeTool,
  listNodesTool,
  createFlowTool,
  addNodeTool,
  updateNodeTool,
} from './tools/index.js';

export function createServer(): Server {
  const server = new Server(
    {
      name: 'clive',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'render_flow',
          description: 'Render a .flow file as ASCII art for display in conversation',
          inputSchema: {
            type: 'object',
            properties: {
              flow_file: {
                type: 'string',
                description: 'Path to the .flow file',
              },
              view: {
                type: 'string',
                enum: ['compact', 'standard', 'detailed'],
                description: 'View mode (default: standard)',
              },
              show_copy: {
                type: 'boolean',
                description: 'Include user-facing text in output',
              },
            },
            required: ['flow_file'],
          },
        },
        {
          name: 'get_node',
          description: 'Get detailed information about a specific node in a flow',
          inputSchema: {
            type: 'object',
            properties: {
              flow_file: {
                type: 'string',
                description: 'Path to the .flow file',
              },
              node_id: {
                type: 'string',
                description: 'ID of the node to retrieve',
              },
            },
            required: ['flow_file', 'node_id'],
          },
        },
        {
          name: 'list_nodes',
          description: 'List all nodes in a flow with their connections',
          inputSchema: {
            type: 'object',
            properties: {
              flow_file: {
                type: 'string',
                description: 'Path to the .flow file',
              },
            },
            required: ['flow_file'],
          },
        },
        {
          name: 'create_flow',
          description: 'Create a new .flow file',
          inputSchema: {
            type: 'object',
            properties: {
              output_path: {
                type: 'string',
                description: 'Path where the flow file should be created',
              },
              name: {
                type: 'string',
                description: 'Name of the flow',
              },
              description: {
                type: 'string',
                description: 'Description of the flow',
              },
              version: {
                type: 'string',
                description: 'Version string (default: 1.0.0)',
              },
              nodes: {
                type: 'array',
                description: 'Array of node definitions',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    type: {
                      type: 'string',
                      enum: ['entry', 'exit', 'decision', 'action', 'input', 'error', 'subprocess'],
                    },
                    copy: {
                      type: 'object',
                      properties: {
                        heading: { type: 'string' },
                        body: { type: 'string' },
                        placeholder: { type: 'string' },
                      },
                    },
                    buttons: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          label: { type: 'string' },
                          goto: { type: 'string' },
                          style: { type: 'string' },
                        },
                        required: ['label', 'goto'],
                      },
                    },
                    transitions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          to: { type: 'string' },
                          trigger: { type: 'string' },
                          condition: { type: 'string' },
                        },
                        required: ['to'],
                      },
                    },
                  },
                  required: ['id', 'name', 'type'],
                },
              },
            },
            required: ['output_path', 'name', 'nodes'],
          },
        },
        {
          name: 'add_node',
          description: 'Add a new node to an existing flow',
          inputSchema: {
            type: 'object',
            properties: {
              flow_file: {
                type: 'string',
                description: 'Path to the .flow file',
              },
              node_id: {
                type: 'string',
                description: 'ID for the new node',
              },
              node_config: {
                type: 'object',
                description: 'Configuration for the new node',
                properties: {
                  name: { type: 'string' },
                  type: {
                    type: 'string',
                    enum: ['entry', 'exit', 'decision', 'action', 'input', 'error', 'subprocess'],
                  },
                  copy: {
                    type: 'object',
                    properties: {
                      heading: { type: 'string' },
                      body: { type: 'string' },
                      placeholder: { type: 'string' },
                    },
                  },
                  buttons: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        label: { type: 'string' },
                        goto: { type: 'string' },
                        style: { type: 'string' },
                      },
                      required: ['label', 'goto'],
                    },
                  },
                  transitions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        to: { type: 'string' },
                        trigger: { type: 'string' },
                        condition: { type: 'string' },
                      },
                      required: ['to'],
                    },
                  },
                  handler: { type: 'string' },
                },
                required: ['name', 'type'],
              },
              connect_from: {
                type: 'string',
                description: 'Node ID to connect from (will add edge from this node)',
              },
              connect_to: {
                type: 'string',
                description: 'Node ID to connect to (when inserting between nodes)',
              },
            },
            required: ['flow_file', 'node_id', 'node_config'],
          },
        },
        {
          name: 'update_node',
          description: 'Update properties of an existing node',
          inputSchema: {
            type: 'object',
            properties: {
              flow_file: {
                type: 'string',
                description: 'Path to the .flow file',
              },
              node_id: {
                type: 'string',
                description: 'ID of the node to update',
              },
              updates: {
                type: 'object',
                description: 'Properties to update',
                properties: {
                  name: { type: 'string' },
                  type: {
                    type: 'string',
                    enum: ['entry', 'exit', 'decision', 'action', 'input', 'error', 'subprocess'],
                  },
                  copy: {
                    type: 'object',
                    properties: {
                      heading: { type: 'string' },
                      body: { type: 'string' },
                      placeholder: { type: 'string' },
                    },
                  },
                  buttons: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        label: { type: 'string' },
                        goto: { type: 'string' },
                        style: { type: 'string' },
                      },
                      required: ['label', 'goto'],
                    },
                  },
                  transitions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        to: { type: 'string' },
                        trigger: { type: 'string' },
                        condition: { type: 'string' },
                      },
                      required: ['to'],
                    },
                  },
                  handler: { type: 'string' },
                },
              },
            },
            required: ['flow_file', 'node_id', 'updates'],
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: unknown;

      switch (name) {
        case 'render_flow':
          result = await renderFlowTool(args as unknown as Parameters<typeof renderFlowTool>[0]);
          break;

        case 'get_node':
          result = await getNodeTool(args as unknown as Parameters<typeof getNodeTool>[0]);
          break;

        case 'list_nodes':
          result = await listNodesTool(args as unknown as Parameters<typeof listNodesTool>[0]);
          break;

        case 'create_flow':
          result = await createFlowTool(args as unknown as Parameters<typeof createFlowTool>[0]);
          break;

        case 'add_node':
          result = await addNodeTool(args as unknown as Parameters<typeof addNodeTool>[0]);
          break;

        case 'update_node':
          result = await updateNodeTool(args as unknown as Parameters<typeof updateNodeTool>[0]);
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      // Format result as text content
      const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2);

      return {
        content: [
          {
            type: 'text',
            text: content,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${message}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}
