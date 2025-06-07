

import React from 'react';
import { Text } from 'react-native';
import { getSeverityColor } from '../../constants/Colors';

const SeverityIcon = ({ severity }) => {
  const color = getSeverityColor(severity);
  let icon = '🟢';
  if (severity === 'High') icon = '🔴';
  else if (severity === 'Medium') icon = '🟠';
  return <Text style={{ color }}>{icon}</Text>;
};

export default SeverityIcon;