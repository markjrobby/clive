import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { renderMermaidAscii } from 'beautiful-mermaid';

interface RenderOptions {
  detailed?: boolean;
}

export async function renderCommand(
  file: string,
  _options: RenderOptions
): Promise<void> {
  const filePath = resolve(process.cwd(), file);

  try {
    const content = await readFile(filePath, 'utf-8');
    const output = renderMermaidAscii(content, {
      useAscii: false,
      paddingX: 3,
      paddingY: 2,
    });
    console.log(output);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('Failed to render diagram');
    }
    process.exit(1);
  }
}
