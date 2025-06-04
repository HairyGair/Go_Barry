import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import { SupervisorProvider } from './components/hooks/useSupervisorSession';

export default function App() {
  return (
    <SupervisorProvider>
      <Slot />
      <StatusBar style="auto" />
    </SupervisorProvider>
  );
}