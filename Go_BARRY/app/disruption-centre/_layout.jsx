import { Stack } from 'expo-router';

export default function DisruptionCentreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Disruption Centre',
        }}
      />
    </Stack>
  );
}
