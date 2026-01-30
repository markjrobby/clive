import React from 'react';
import { Box, Text } from 'ink';
import { renderMermaidAscii } from 'beautiful-mermaid';

interface MermaidViewProps {
  content: string;
}

export function MermaidView({ content }: MermaidViewProps): React.ReactElement {
  let rendered: string;
  let error: string | null = null;

  try {
    rendered = renderMermaidAscii(content, {
      useAscii: false, // Use Unicode for nicer output
      paddingX: 3,
      paddingY: 2,
    });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to render diagram';
    rendered = '';
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Render error: {error}</Text>
        <Box marginTop={1}>
          <Text color="gray">{content}</Text>
        </Box>
      </Box>
    );
  }

  const lines = rendered.split('\n');

  return (
    <Box flexDirection="column">
      {lines.map((line, index) => (
        <Text key={index}>{line}</Text>
      ))}
    </Box>
  );
}
