import { Stack } from 'expo-router';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { SupervisorProvider } from '../components/hooks/useSupervisorSession';

const convex = new ConvexReactClient('https://standing-octopus-908.convex.cloud');

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <SupervisorProvider>
        <Stack />
      </SupervisorProvider>
    </ConvexProvider>
  );
}
