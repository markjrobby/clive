/**
 * Core types for Clive flow files
 */

// Node types supported by .flow files
export type NodeType =
  | 'entry'
  | 'exit'
  | 'decision'
  | 'action'
  | 'input'
  | 'error'
  | 'subprocess';

// Button styles
export type ButtonStyle = 'primary' | 'secondary' | 'danger' | 'link';

// Transition triggers
export type TransitionTrigger = 'auto' | 'condition' | 'event' | string;

// Edge styles
export type EdgeStyle = 'solid' | 'dashed' | 'dotted';

// Layout directions
export type LayoutDirection = 'horizontal' | 'vertical' | 'auto';

// Themes
export type Theme = 'default' | 'minimal' | 'detailed';

/**
 * User-facing copy/text for a node
 */
export interface Copy {
  heading?: string;
  body?: string;
  placeholder?: string;
}

/**
 * A button on a node (for decision/action types)
 */
export interface Button {
  label: string;
  style?: ButtonStyle;
  goto: string;
  condition?: string;
  data?: Record<string, unknown>;
}

/**
 * A transition from a node (for input/error/action types)
 */
export interface Transition {
  to: string;
  trigger?: TransitionTrigger;
  condition?: string;
  label?: string;
}

/**
 * Validation rule for input nodes
 */
export interface ValidationRule {
  type: 'email' | 'phone' | 'regex' | 'min_length' | 'max_length' | 'custom';
  pattern?: string;
  value?: number;
  error?: string;
}

/**
 * State requirements and modifications for a node
 */
export interface NodeState {
  requires?: string[];
  sets?: string[];
  clears?: string[];
}

/**
 * A node in the flow
 */
export interface FlowNode {
  id: string;
  name: string;
  type: NodeType;
  handler?: string;
  description?: string;
  copy?: Copy;
  buttons?: Button[];
  transitions?: Transition[];
  state?: NodeState;
  validation?: ValidationRule[];
  notes?: string;
  subprocess?: string;
  parent?: string;
}

/**
 * An edge between two nodes
 */
export interface Edge {
  from: string;
  to: string;
  label?: string;
  style?: EdgeStyle;
  color?: string;
  fromButton?: string;
}

/**
 * Flow metadata
 */
export interface FlowMeta {
  name: string;
  version?: string;
  description?: string;
  owner?: string;
  tags?: string[];
}

/**
 * Flow configuration
 */
export interface FlowConfig {
  layout?: LayoutDirection;
  theme?: Theme;
}

/**
 * Import reference to another flow
 */
export interface FlowImport {
  path: string;
  prefix?: string;
}

/**
 * Complete parsed flow structure
 */
export interface Flow {
  meta: FlowMeta;
  config?: FlowConfig;
  imports?: FlowImport[];
  nodes: Map<string, FlowNode>;
  edges: Edge[];
}

/**
 * A node with assigned position for rendering
 */
export interface PositionedNode extends FlowNode {
  x: number;
  y: number;
  width: number;
  height: number;
  layer: number;
  order: number;
}

/**
 * A point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * A routed edge with path points
 */
export interface RoutedEdge extends Edge {
  points: Point[];
}

/**
 * Result of layout computation
 */
export interface LayoutResult {
  nodes: PositionedNode[];
  edges: RoutedEdge[];
  width: number;
  height: number;
  layers: number;
}

/**
 * Layout options
 */
export interface LayoutOptions {
  direction?: 'TB' | 'LR';
  nodeWidth?: number;
  nodeHeight?: number;
  horizontalSpacing?: number;
  verticalSpacing?: number;
  detailed?: boolean;
}

/**
 * Parse result (success or error)
 */
export interface ParseResult {
  success: boolean;
  flow?: Flow;
  errors?: ParseError[];
}

/**
 * Parse error details
 */
export interface ParseError {
  message: string;
  line?: number;
  column?: number;
  path?: string;
}
