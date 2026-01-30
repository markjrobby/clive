import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { watch } from 'chokidar';
import { readFile } from 'fs/promises';
import { basename } from 'path';
import { MermaidView } from './components/MermaidView.js';

interface AppProps {
  filePath: string;
  detailed: boolean;
  splitView?: boolean;
}

export function App({ filePath }: AppProps): React.ReactElement {
  const { exit } = useApp();
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Initial load
    loadFile();

    // Watch for changes
    const watcher = watch(filePath, { ignoreInitial: true });
    watcher.on('change', loadFile);

    return () => {
      watcher.close();
    };
  }, [filePath]);

  async function loadFile() {
    try {
      const text = await readFile(filePath, 'utf-8');
      setContent(text);
      setError(null);
      setLastUpdate(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read file');
    }
  }

  // Handle keyboard input
  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text color="cyan" bold>Clive</Text>
        <Text color="gray"> • </Text>
        <Text>{basename(filePath)}</Text>
        {lastUpdate && (
          <>
            <Text color="gray"> • </Text>
            <Text color="gray" dimColor>
              {lastUpdate.toLocaleTimeString()}
            </Text>
          </>
        )}
      </Box>

      {error && (
        <Box borderStyle="single" borderColor="red" padding={1} marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      {content && <MermaidView content={content} />}

      <Box marginTop={1}>
        <Text color="gray">Press </Text>
        <Text color="cyan">q</Text>
        <Text color="gray"> to quit • Watching for changes...</Text>
      </Box>
    </Box>
  );
}
