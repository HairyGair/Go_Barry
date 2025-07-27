import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function DisruptionsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect directly to disruption centre to eliminate navigation friction
    router.replace('/disruption-centre');
  }, [router]);

  return null; // No UI needed since we're redirecting immediately
}
