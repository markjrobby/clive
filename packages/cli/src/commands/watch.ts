import { resolve } from 'path';
import { render } from 'ink';
import React from 'react';
import { App } from '../app.js';

interface WatchOptions {
  detailed?: boolean;
  split?: boolean;
}

export async function watchCommand(
  file: string,
  options: WatchOptions
): Promise<void> {
  const filePath = resolve(process.cwd(), file);

  const { waitUntilExit } = render(
    React.createElement(App, {
      filePath,
      detailed: options.detailed || false,
      splitView: options.split || false,
    })
  );

  await waitUntilExit();
}
