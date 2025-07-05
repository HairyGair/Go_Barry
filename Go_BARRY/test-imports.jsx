// Test file to verify imports
import React from 'react';
import { View, Text } from 'react-native';

// Test imports from operations-centre
import { UK_LOCALE } from '../app/operations-centre/constants';
import { operationsTheme } from '../app/operations-centre/styles';

export default function TestImports() {
  console.log('UK_LOCALE:', UK_LOCALE);
  console.log('operationsTheme:', operationsTheme);
  
  return (
    <View>
      <Text>Test Imports Working!</Text>
      <Text>Operations Centre: {UK_LOCALE.OPERATIONS_CENTRE}</Text>
      <Text>Theme Background: {operationsTheme.colors.background}</Text>
    </View>
  );
}
