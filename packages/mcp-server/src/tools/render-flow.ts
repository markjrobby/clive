import { resolve } from 'path';
import { parseFlowFile } from '@clive/core';
import { renderFlowToString } from '@clive/renderer';

export interface RenderFlowParams {
  flow_file: string;
  view?: 'compact' | 'standard' | 'detailed';
  show_copy?: boolean;
}

export async function renderFlowTool(params: RenderFlowParams): Promise<string> {
  const filePath = resolve(process.cwd(), params.flow_file);
  const result = await parseFlowFile(filePath);

  if (!result.success) {
    const errors = result.errors?.map((e) => e.message).join(', ') || 'Unknown error';
    throw new Error(`Failed to parse flow file: ${errors}`);
  }

  const detailed = params.view === 'detailed' || params.show_copy;

  return renderFlowToString(result.flow!, { detailed });
}
