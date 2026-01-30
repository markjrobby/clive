import type { PositionedNode } from '@clive/core';
import { Grid } from './grid.js';
import { NODE_ICONS } from './icons.js';

export interface NodeRenderOptions {
  detailed?: boolean;
  maxLabelWidth?: number;
}

/**
 * Render a node as a box with icon and label
 * Decision nodes are rendered as diamonds
 */
export function renderNode(
  grid: Grid,
  node: PositionedNode,
  options: NodeRenderOptions = {}
): void {
  const { detailed = false, maxLabelWidth = 16 } = options;
  const { x, y, width, height } = node;

  // Decision nodes get diamond shape, others get box
  if (node.type === 'decision') {
    renderDiamondNode(grid, node, options);
    return;
  }

  // Draw box border
  grid.box(x, y, width, height);

  // Node content line
  const icon = NODE_ICONS[node.type] || '?';
  const label = truncate(`${node.id}`, maxLabelWidth - 4);
  const content = `${icon} ${label}`;

  // Center content in the box
  const contentY = y + 1;
  const contentX = x + 1;

  // Clear interior and write content
  grid.fill(x + 1, y + 1, width - 2, height - 2);
  grid.writeString(contentX, contentY, padCenter(content, width - 2));

  // If detailed mode, add copy text
  if (detailed && height > 3 && node.copy?.heading) {
    const heading = truncate(`"${node.copy.heading}"`, width - 4);
    grid.writeString(x + 1, y + 2, padCenter(heading, width - 2));
  }
}

/**
 * Render a decision node as a diamond shape
 */
function renderDiamondNode(
  grid: Grid,
  node: PositionedNode,
  options: NodeRenderOptions = {}
): void {
  const { maxLabelWidth = 16 } = options;
  const { x, y, width, height } = node;

  const centerX = x + Math.floor(width / 2);
  const centerY = y + Math.floor(height / 2);

  // Draw diamond outline using box-drawing characters
  //       ╱╲
  //      ╱  ╲
  //     <    >
  //      ╲  ╱
  //       ╲╱

  // Top point
  grid.set(centerX, y, '╱');
  grid.set(centerX + 1, y, '╲');

  // Upper slopes
  for (let row = 1; row < centerY - y; row++) {
    const offset = row;
    grid.set(centerX - offset, y + row, '╱');
    grid.set(centerX + 1 + offset, y + row, '╲');
  }

  // Middle row (widest part)
  grid.set(x, centerY, '<');
  grid.set(x + width - 1, centerY, '>');

  // Lower slopes
  for (let row = 1; row < centerY - y; row++) {
    const offset = (centerY - y) - row;
    grid.set(centerX - offset, centerY + row, '╲');
    grid.set(centerX + 1 + offset, centerY + row, '╱');
  }

  // Bottom point
  grid.set(centerX, y + height - 1, '╲');
  grid.set(centerX + 1, y + height - 1, '╱');

  // Content in the middle
  const icon = NODE_ICONS[node.type] || '◇';
  const label = truncate(`${node.id}`, maxLabelWidth - 4);
  const content = `${icon} ${label}`;

  grid.writeString(centerX - Math.floor(content.length / 2), centerY, content);
}

/**
 * Truncate string to max length with ellipsis
 */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

/**
 * Pad string to center it in a given width
 */
function padCenter(str: string, width: number): string {
  if (str.length >= width) return str.slice(0, width);
  const leftPad = Math.floor((width - str.length) / 2);
  const rightPad = width - str.length - leftPad;
  return ' '.repeat(leftPad) + str + ' '.repeat(rightPad);
}

/**
 * Calculate the width needed for a node based on its content
 */
export function calculateNodeWidth(node: PositionedNode, minWidth = 16): number {
  const labelWidth = node.id.length + 2; // icon + space + label
  const headingWidth = node.copy?.heading ? node.copy.heading.length + 4 : 0;

  return Math.max(minWidth, labelWidth + 4, headingWidth + 4);
}
