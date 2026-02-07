import React from 'react';
import { Text, Box } from 'ink';
import { VERSION } from '@inxtone/core';

export function App(): React.ReactElement {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        Inxtone v{VERSION}
      </Text>
      <Text>AI-Native Storytelling Framework</Text>
    </Box>
  );
}
