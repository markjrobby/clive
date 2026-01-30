import { z } from 'zod';

/**
 * Zod schemas for .flow file validation
 */

export const NodeTypeSchema = z.enum([
  'entry',
  'exit',
  'decision',
  'action',
  'input',
  'error',
  'subprocess',
]);

export const ButtonStyleSchema = z.enum(['primary', 'secondary', 'danger', 'link']);

export const EdgeStyleSchema = z.enum(['solid', 'dashed', 'dotted']);

export const LayoutDirectionSchema = z.enum(['horizontal', 'vertical', 'auto']);

export const ThemeSchema = z.enum(['default', 'minimal', 'detailed']);

export const CopySchema = z.object({
  heading: z.string().optional(),
  body: z.string().optional(),
  placeholder: z.string().optional(),
});

export const ButtonSchema = z.object({
  label: z.string().min(1, 'Button label is required'),
  style: ButtonStyleSchema.optional(),
  goto: z.string().min(1, 'Button goto is required'),
  condition: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});

export const TransitionSchema = z.object({
  to: z.string().min(1, 'Transition target is required'),
  trigger: z.string().optional(),
  condition: z.string().optional(),
  label: z.string().optional(),
});

export const ValidationRuleSchema = z.object({
  type: z.enum(['email', 'phone', 'regex', 'min_length', 'max_length', 'custom']),
  pattern: z.string().optional(),
  value: z.number().optional(),
  error: z.string().optional(),
});

export const NodeStateSchema = z.object({
  requires: z.array(z.string()).optional(),
  sets: z.array(z.string()).optional(),
  clears: z.array(z.string()).optional(),
});

export const NodeSchema = z.object({
  name: z.string().min(1, 'Node name is required'),
  type: NodeTypeSchema,
  handler: z.string().optional(),
  description: z.string().optional(),
  copy: CopySchema.optional(),
  buttons: z.array(ButtonSchema).optional(),
  transitions: z.array(TransitionSchema).optional(),
  state: NodeStateSchema.optional(),
  validation: z.array(ValidationRuleSchema).optional(),
  notes: z.string().optional(),
  subprocess: z.string().optional(),
  parent: z.string().optional(),
});

export const MetaSchema = z.object({
  name: z.string().min(1, 'Flow name is required'),
  version: z.string().optional(),
  description: z.string().optional(),
  owner: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const ConfigSchema = z.object({
  layout: LayoutDirectionSchema.optional(),
  theme: ThemeSchema.optional(),
});

export const ImportSchema = z.object({
  path: z.string().min(1, 'Import path is required'),
  prefix: z.string().optional(),
});

export const EdgeDefinitionSchema = z.object({
  label: z.string().optional(),
  style: EdgeStyleSchema.optional(),
  color: z.string().optional(),
});

export const FlowFileSchema = z.object({
  meta: MetaSchema,
  config: ConfigSchema.optional(),
  imports: z.array(ImportSchema).optional(),
  nodes: z.record(NodeSchema),
  edges: z.record(EdgeDefinitionSchema).optional(),
});

export type FlowFileInput = z.infer<typeof FlowFileSchema>;
export type NodeInput = z.infer<typeof NodeSchema>;
