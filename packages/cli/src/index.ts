#!/usr/bin/env node

import { Command } from 'commander';
import { watchCommand } from './commands/watch.js';
import { renderCommand } from './commands/render.js';
import { autoWatchCommand } from './commands/auto-watch.js';
import { sessionCommand } from './commands/session.js';

const program = new Command();

program
  .name('clive')
  .description('Flow visualization for Claude Code CLI - Miro in the terminal')
  .version('0.1.0');

program
  .command('watch <file>')
  .description('Watch a .mmd file and render it in real-time')
  .option('-d, --detailed', 'Show detailed view with copy text')
  .option('-s, --split', 'Show split view with node details panel')
  .action(watchCommand);

program
  .command('auto')
  .description('Auto-detect and watch .mmd files in current directory')
  .option('-d, --detailed', 'Show detailed view with copy text')
  .action(autoWatchCommand);

program
  .command('render <file>')
  .description('Render a .mmd file to stdout (one-shot)')
  .option('-d, --detailed', 'Show detailed view with copy text')
  .action(renderCommand);

// Default action: no subcommand → launch session (tmux + Claude + viewer)
program
  .argument('[file]', 'Optional .mmd file to watch')
  .action(async (file?: string) => {
    // Only trigger default when no subcommand was matched
    if (!file && program.args.length === 0) {
      await sessionCommand({ file: undefined });
    } else if (file) {
      await sessionCommand({ file });
    }
  });

program.parse();
