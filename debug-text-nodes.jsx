// Go_BARRY/debug-text-nodes.jsx
// Debug component to find loose text nodes

import React from 'react';
import { View, Text } from 'react-native';

const DebugTextNodes = () => {
  return (
    <View>
      <Text>Testing text nodes</Text>
      {/* This would cause error: */}
      {/* . */}
      
      {/* Correct way: */}
      <Text>.</Text>
    </View>
  );
};

export default DebugTextNodes;