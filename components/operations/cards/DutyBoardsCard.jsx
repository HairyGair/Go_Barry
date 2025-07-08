import React from 'react';
import { View, StyleSheet } from 'react-native';
import DutyBoards from '../DutyBoards';

export default function DutyBoardsCard() {
  return (
    <View style={styles.container}>
      <DutyBoards />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
