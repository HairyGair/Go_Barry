// Redirect to the new Operations Centre
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Operations() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new operations centre
    router.replace('/operations-centre');
  }, []);
  
  return null;
}
