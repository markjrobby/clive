import type { RoutedEdge, Point } from '@clive/core';
import { Grid } from './grid.js';
import { EDGE, ARROWS } from './icons.js';

/**
 * Render an edge on the grid
 */
export function renderEdge(grid: Grid, edge: RoutedEdge): void {
  const points = edge.points;
  if (points.length < 2) return;

  // Draw segments
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];
    const isLast = i === points.length - 2;
    drawSegment(grid, from, to, isLast);
  }

  // Draw corners
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    drawCorner(grid, prev, curr, next);
  }
}

/**
 * Draw a line segment between two points
 */
function drawSegment(
  grid: Grid,
  from: Point,
  to: Point,
  isLast: boolean
): void {
  const x1 = Math.round(from.x);
  const y1 = Math.round(from.y);
  const x2 = Math.round(to.x);
  const y2 = Math.round(to.y);

  if (x1 === x2) {
    // Vertical segment
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const goingDown = y2 > y1;

    for (let y = minY; y <= maxY; y++) {
      const existing = grid.get(x1, y);
      // Only draw on empty spaces or existing lines
      if (existing === ' ' || existing === EDGE.vertical || existing === '│') {
        if (isLast && y === (goingDown ? maxY : minY)) {
          grid.set(x1, y, goingDown ? ARROWS.down : ARROWS.up);
        } else {
          grid.set(x1, y, EDGE.vertical);
        }
      }
    }
  } else if (y1 === y2) {
    // Horizontal segment
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const goingRight = x2 > x1;

    for (let x = minX; x <= maxX; x++) {
      const existing = grid.get(x, y1);
      if (existing === ' ' || existing === EDGE.horizontal || existing === '─') {
        if (isLast && x === (goingRight ? maxX : minX)) {
          grid.set(x, y1, goingRight ? ARROWS.right : ARROWS.left);
        } else {
          grid.set(x, y1, EDGE.horizontal);
        }
      }
    }
  }
}

/**
 * Draw corner at a bend point
 */
function drawCorner(grid: Grid, prev: Point, curr: Point, next: Point): void {
  const x = Math.round(curr.x);
  const y = Math.round(curr.y);

  const fromLeft = prev.x < curr.x;
  const fromRight = prev.x > curr.x;
  const fromTop = prev.y < curr.y;
  const fromBottom = prev.y > curr.y;

  const toLeft = next.x < curr.x;
  const toRight = next.x > curr.x;
  const toTop = next.y < curr.y;
  const toBottom = next.y > curr.y;

  let corner: string | null = null;

  if ((fromTop && toRight) || (fromLeft && toBottom)) {
    corner = EDGE.cornerTopLeft; // ┌
  } else if ((fromTop && toLeft) || (fromRight && toBottom)) {
    corner = EDGE.cornerTopRight; // ┐
  } else if ((fromBottom && toRight) || (fromLeft && toTop)) {
    corner = EDGE.cornerBottomLeft; // └
  } else if ((fromBottom && toLeft) || (fromRight && toTop)) {
    corner = EDGE.cornerBottomRight; // ┘
  }

  if (corner) {
    const existing = grid.get(x, y);
    // Only draw corner if space is empty or has a line
    if (existing === ' ' || existing === EDGE.vertical || existing === EDGE.horizontal) {
      grid.set(x, y, corner);
    }
  }
}

/**
 * Render all edges on the grid
 */
export function renderEdges(grid: Grid, edges: RoutedEdge[]): void {
  for (const edge of edges) {
    renderEdge(grid, edge);
  }
}
