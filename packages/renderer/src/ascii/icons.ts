import type { NodeType } from '@clive/core';

/**
 * Unicode icons for each node type
 */
export const NODE_ICONS: Record<NodeType, string> = {
  entry: '○',
  exit: '◉',
  decision: '◇',
  action: '□',
  input: '▭',
  error: '⚠',
  subprocess: '⊞',
};

/**
 * Box drawing characters
 */
export const BOX = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  horizontalDown: '┬',
  horizontalUp: '┴',
  verticalRight: '├',
  verticalLeft: '┤',
  cross: '┼',
} as const;

/**
 * Arrow characters
 */
export const ARROWS = {
  down: '▼',
  up: '▲',
  right: '▶',
  left: '◀',
} as const;

/**
 * Edge drawing characters
 */
export const EDGE = {
  vertical: '│',
  horizontal: '─',
  cornerTopLeft: '┌',
  cornerTopRight: '┐',
  cornerBottomLeft: '└',
  cornerBottomRight: '┘',
} as const;
