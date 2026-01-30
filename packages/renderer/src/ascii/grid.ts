/**
 * A 2D character grid for compositing ASCII art
 */
export class Grid {
  private cells: string[][];
  public readonly width: number;
  public readonly height: number;

  constructor(width: number, height: number, fill = ' ') {
    this.width = width;
    this.height = height;
    this.cells = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => fill)
    );
  }

  /**
   * Get character at position
   */
  get(x: number, y: number): string {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return ' ';
    }
    return this.cells[y][x];
  }

  /**
   * Set character at position
   */
  set(x: number, y: number, char: string): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return;
    }
    // Only take first character
    this.cells[y][x] = char.charAt(0) || ' ';
  }

  /**
   * Write a string starting at position (left-to-right)
   */
  writeString(x: number, y: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      this.set(x + i, y, str[i]);
    }
  }

  /**
   * Draw a horizontal line
   */
  horizontalLine(x1: number, x2: number, y: number, char = '─'): void {
    const start = Math.min(x1, x2);
    const end = Math.max(x1, x2);
    for (let x = start; x <= end; x++) {
      this.set(x, y, char);
    }
  }

  /**
   * Draw a vertical line
   */
  verticalLine(x: number, y1: number, y2: number, char = '│'): void {
    const start = Math.min(y1, y2);
    const end = Math.max(y1, y2);
    for (let y = start; y <= end; y++) {
      this.set(x, y, char);
    }
  }

  /**
   * Draw a box
   */
  box(
    x: number,
    y: number,
    width: number,
    height: number,
    corners = { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' }
  ): void {
    // Top edge
    this.set(x, y, corners.tl);
    this.horizontalLine(x + 1, x + width - 2, y, corners.h);
    this.set(x + width - 1, y, corners.tr);

    // Bottom edge
    this.set(x, y + height - 1, corners.bl);
    this.horizontalLine(x + 1, x + width - 2, y + height - 1, corners.h);
    this.set(x + width - 1, y + height - 1, corners.br);

    // Left and right edges
    for (let row = y + 1; row < y + height - 1; row++) {
      this.set(x, row, corners.v);
      this.set(x + width - 1, row, corners.v);
    }
  }

  /**
   * Fill a rectangular area
   */
  fill(x: number, y: number, width: number, height: number, char = ' '): void {
    for (let row = y; row < y + height; row++) {
      for (let col = x; col < x + width; col++) {
        this.set(col, row, char);
      }
    }
  }

  /**
   * Draw a diamond shape (for decision nodes)
   * The diamond fits within the given bounding box
   */
  diamond(x: number, y: number, width: number, height: number): void {
    const centerX = x + Math.floor(width / 2);
    const centerY = y + Math.floor(height / 2);
    const halfWidth = Math.floor(width / 2);
    const halfHeight = Math.floor(height / 2);

    // For a 3-row diamond (height=3):
    //     ◇      top point
    //    ╱ ╲     middle row (widest)
    //     ◇      bottom point

    // For simplicity, draw a text-based diamond that scales
    if (height === 3) {
      // Compact diamond
      this.set(centerX, y, '◇');
      this.set(centerX - halfWidth, centerY, '◇');
      this.horizontalLine(centerX - halfWidth + 1, centerX + halfWidth - 1, centerY, '─');
      this.set(centerX + halfWidth, centerY, '◇');
      this.set(centerX, y + height - 1, '◇');

      // Draw diagonal edges
      for (let i = 1; i < halfWidth; i++) {
        if (i < halfHeight) {
          this.set(centerX - i, centerY - 1, '╱');
          this.set(centerX + i, centerY - 1, '╲');
          this.set(centerX - i, centerY + 1, '╲');
          this.set(centerX + i, centerY + 1, '╱');
        }
      }
    } else {
      // Larger diamond using box-drawing slashes
      // Top half
      for (let row = 0; row <= halfHeight; row++) {
        const rowWidth = Math.floor((row / halfHeight) * halfWidth);
        if (row === 0) {
          this.set(centerX, y, '◇');
        } else {
          this.set(centerX - rowWidth, y + row, '╱');
          this.set(centerX + rowWidth, y + row, '╲');
          // Fill middle with spaces (already default)
        }
      }
      // Bottom half
      for (let row = 1; row <= halfHeight; row++) {
        const rowWidth = Math.floor(((halfHeight - row) / halfHeight) * halfWidth);
        if (row === halfHeight) {
          this.set(centerX, y + height - 1, '◇');
        } else {
          this.set(centerX - rowWidth, centerY + row, '╲');
          this.set(centerX + rowWidth, centerY + row, '╱');
        }
      }
    }
  }

  /**
   * Convert grid to array of strings (one per row)
   */
  toLines(): string[] {
    return this.cells.map((row) => row.join(''));
  }

  /**
   * Convert grid to single string
   */
  toString(): string {
    return this.toLines().join('\n');
  }

  /**
   * Trim trailing whitespace from each line
   */
  trimRight(): Grid {
    const lines = this.toLines().map((line) => line.trimEnd());
    const maxWidth = Math.max(...lines.map((l) => l.length), 1);

    const newGrid = new Grid(maxWidth, this.height);
    for (let y = 0; y < this.height; y++) {
      newGrid.writeString(0, y, lines[y]);
    }
    return newGrid;
  }
}
