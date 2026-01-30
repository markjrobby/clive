import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { basename, resolve } from 'path';
import { CLIVE_CONTEXT, CLIVE_CONTEXT_MARKER } from '../context.js';

/**
 * Launch a Clive session: tmux with Claude Code (left) + diagram viewer (right).
 * Falls back to standalone auto-watch if tmux is not available.
 */
export async function sessionCommand(options: { file?: string }): Promise<void> {
  const cwd = process.cwd();

  // Inject .claude/CLAUDE.md context
  injectContext(cwd);

  // Check for tmux
  if (!hasTmux()) {
    console.log('tmux not found — launching diagram viewer standalone.');
    console.log('Install tmux for the full side-by-side experience:');
    console.log('  macOS:  brew install tmux');
    console.log('  Ubuntu: sudo apt install tmux');
    console.log('');

    // Fall back to auto-watch
    const { autoWatchCommand } = await import('./auto-watch.js');
    return autoWatchCommand({ detailed: false });
  }

  // Resolve the path to this CLI's compiled entry point
  const cliPath = resolve(new URL(import.meta.url).pathname, '../../index.js');

  const sessionName = `clive-${basename(cwd)}`;

  // Kill existing session if present
  try {
    execSync(`tmux kill-session -t "${sessionName}" 2>/dev/null`, { stdio: 'ignore' });
  } catch {
    // ignore — no existing session
  }

  // Get terminal dimensions
  let cols = '200';
  let lines = '50';
  try {
    cols = execSync('tput cols', { encoding: 'utf-8' }).trim();
    lines = execSync('tput lines', { encoding: 'utf-8' }).trim();
  } catch {
    // use defaults
  }

  // Create tmux session
  execSync(`tmux new-session -d -s "${sessionName}" -x "${cols}" -y "${lines}"`, {
    cwd,
    stdio: 'ignore',
  });

  // Configure tmux
  execSync(`tmux set-option -t "${sessionName}" -g mouse on`, { stdio: 'ignore' });
  execSync(`tmux set-option -t "${sessionName}" -g history-limit 50000`, { stdio: 'ignore' });
  execSync(
    `tmux set-option -t "${sessionName}" -g terminal-overrides 'xterm*:smcup@:rmcup@'`,
    { stdio: 'ignore' },
  );

  // Split window: left for Claude, right for Clive
  execSync(`tmux split-window -h -t "${sessionName}"`, { cwd, stdio: 'ignore' });

  // Left pane (0): Claude Code
  execSync(`tmux send-keys -t "${sessionName}:0.0" "claude" Enter`, { stdio: 'ignore' });

  // Right pane (1): Clive auto-watch or specific file
  if (options.file && existsSync(options.file)) {
    const absFile = resolve(cwd, options.file);
    execSync(
      `tmux send-keys -t "${sessionName}:0.1" "node '${cliPath}' watch '${absFile}'" Enter`,
      { stdio: 'ignore' },
    );
  } else {
    execSync(
      `tmux send-keys -t "${sessionName}:0.1" "node '${cliPath}' auto" Enter`,
      { stdio: 'ignore' },
    );
  }

  // Resize: 60% left (Claude), 40% right (diagram)
  execSync(`tmux resize-pane -t "${sessionName}:0.0" -x "60%"`, { stdio: 'ignore' });

  // Select left pane as active
  execSync(`tmux select-pane -t "${sessionName}:0.0"`, { stdio: 'ignore' });

  // Attach to the session (replaces this process)
  const tmux = spawn('tmux', ['attach', '-t', sessionName], {
    stdio: 'inherit',
    cwd,
  });

  await new Promise<void>((resolve, reject) => {
    tmux.on('close', () => resolve());
    tmux.on('error', reject);
  });
}

function hasTmux(): boolean {
  try {
    execSync('command -v tmux', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function injectContext(cwd: string): void {
  const claudeDir = resolve(cwd, '.claude');
  const claudeMd = resolve(claudeDir, 'CLAUDE.md');

  if (!existsSync(claudeDir)) {
    mkdirSync(claudeDir, { recursive: true });
  }

  if (!existsSync(claudeMd)) {
    writeFileSync(claudeMd, CLIVE_CONTEXT, 'utf-8');
    console.log('Created .claude/CLAUDE.md with Clive flow instructions');
  } else {
    const existing = readFileSync(claudeMd, 'utf-8');
    if (!existing.includes(CLIVE_CONTEXT_MARKER)) {
      writeFileSync(claudeMd, existing + '\n' + CLIVE_CONTEXT, 'utf-8');
      console.log('Added Clive flow instructions to .claude/CLAUDE.md');
    }
  }
}
