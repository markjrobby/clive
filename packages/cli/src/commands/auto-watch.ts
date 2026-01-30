import { resolve } from 'path';
import { render } from 'ink';
import React from 'react';
import { glob } from 'glob';
import { AutoWatchApp } from '../components/AutoWatchApp.js';

interface AutoWatchOptions {
  detailed?: boolean;
}

export async function autoWatchCommand(
  options: AutoWatchOptions
): Promise<void> {
  const cwd = process.cwd();

  // Find existing .mmd and .mermaid files
  const existingFiles = await glob('**/*.{mmd,mermaid}', {
    cwd,
    ignore: ['node_modules/**', 'dist/**', '.git/**'],
  });

  const { waitUntilExit } = render(
    React.createElement(AutoWatchApp, {
      cwd,
      initialFiles: existingFiles.map(f => resolve(cwd, f)),
      detailed: options.detailed || false,
    })
  );

  await waitUntilExit();
}
