import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { watch } from 'chokidar';
import { basename, relative } from 'path';
import { readFile } from 'fs/promises';
import { MermaidView } from './MermaidView.js';

interface AutoWatchAppProps {
  cwd: string;
  initialFiles: string[];
  detailed: boolean;
}

export function AutoWatchApp({
  cwd,
  initialFiles,
}: AutoWatchAppProps): React.ReactElement {
  const { exit } = useApp();
  const [mermaidFiles, setMermaidFiles] = useState<string[]>(initialFiles);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Watch for new .mmd/.mermaid files
  useEffect(() => {
    const watcher = watch('**/*.{mmd,mermaid}', {
      cwd,
      ignored: ['node_modules/**', 'dist/**', '.git/**'],
      ignoreInitial: true,
    });

    watcher.on('add', (path) => {
      const fullPath = `${cwd}/${path}`;
      setMermaidFiles((prev) => {
        if (!prev.includes(fullPath)) {
          // Auto-select newly created file
          const newFiles = [...prev, fullPath];
          setSelectedIndex(newFiles.length - 1);
          return newFiles;
        }
        return prev;
      });
    });

    watcher.on('unlink', (path) => {
      const fullPath = `${cwd}/${path}`;
      setMermaidFiles((prev) => prev.filter((f) => f !== fullPath));
    });

    return () => {
      watcher.close();
    };
  }, [cwd]);

  // Watch and read the selected file
  useEffect(() => {
    if (mermaidFiles.length === 0) {
      setContent(null);
      return;
    }

    const selectedFile = mermaidFiles[selectedIndex];
    if (!selectedFile) {
      setSelectedIndex(0);
      return;
    }

    // Initial read
    loadFile(selectedFile);

    // Watch for changes
    const watcher = watch(selectedFile, { ignoreInitial: true });
    watcher.on('change', () => {
      loadFile(selectedFile);
    });

    return () => {
      watcher.close();
    };
  }, [mermaidFiles, selectedIndex]);

  async function loadFile(filePath: string) {
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
    if (mermaidFiles.length > 1) {
      if (key.leftArrow || input === 'h') {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.rightArrow || input === 'l') {
        setSelectedIndex((prev) => Math.min(mermaidFiles.length - 1, prev + 1));
      }
    }
  });

  // Waiting state - no mermaid files yet
  if (mermaidFiles.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box borderStyle="single" borderColor="gray" padding={2} flexDirection="column">
          <Text color="cyan" bold>Clive - Waiting for diagram...</Text>
          <Box marginTop={1}>
            <Text color="gray">Watching: </Text>
            <Text>{cwd}</Text>
          </Box>
          <Box marginTop={1}>
            <Text color="gray">
              Create a .mmd or .mermaid file to see it rendered here.
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color="gray" dimColor>
              Tip: Ask Claude to "create a checkout flow diagram"
            </Text>
          </Box>
        </Box>
        <Box marginTop={1}>
          <Text color="gray">Press </Text>
          <Text color="cyan">q</Text>
          <Text color="gray"> to quit</Text>
        </Box>
      </Box>
    );
  }

  const selectedFile = mermaidFiles[selectedIndex];

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text color="cyan" bold>Clive</Text>
        <Text color="gray"> • </Text>
        <Text>{relative(cwd, selectedFile) || basename(selectedFile)}</Text>
        {lastUpdate && (
          <>
            <Text color="gray"> • </Text>
            <Text color="gray" dimColor>
              {lastUpdate.toLocaleTimeString()}
            </Text>
          </>
        )}
      </Box>

      {/* File tabs if multiple */}
      {mermaidFiles.length > 1 && (
        <Box marginBottom={1}>
          {mermaidFiles.map((file, i) => (
            <Box key={file} marginRight={1}>
              {i === selectedIndex ? (
                <Text color="cyan" bold>[{basename(file)}]</Text>
              ) : (
                <Text color="gray">{basename(file)}</Text>
              )}
            </Box>
          ))}
          <Text color="gray" dimColor> (←/→ to switch)</Text>
        </Box>
      )}

      {/* Error display */}
      {error && (
        <Box borderStyle="single" borderColor="red" padding={1} marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      {/* Mermaid diagram */}
      {content && <MermaidView content={content} />}

      {/* Footer */}
      <Box marginTop={1}>
        <Text color="gray">Press </Text>
        <Text color="cyan">q</Text>
        <Text color="gray"> to quit</Text>
        {mermaidFiles.length > 1 && (
          <>
            <Text color="gray"> • </Text>
            <Text color="cyan">←/→</Text>
            <Text color="gray"> to switch files</Text>
          </>
        )}
        <Text color="gray"> • Watching for changes...</Text>
      </Box>
    </Box>
  );
}
