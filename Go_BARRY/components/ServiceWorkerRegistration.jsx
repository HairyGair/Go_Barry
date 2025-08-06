// Service Worker Registration Component for Web Platform
import { useEffect } from 'react';
import { Platform } from 'react-native';

const ServiceWorkerRegistration = () => {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Only register in production or with HTTPS
    const shouldRegister = 
      window.location.protocol === 'https:' || 
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (!shouldRegister || !('serviceWorker' in navigator)) {
      console.log('Service Worker not supported or not in secure context');
      return;
    }

    const registerServiceWorker = async () => {
      try {
        // Wait for window load
        await new Promise(resolve => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            window.addEventListener('load', resolve, { once: true });
          }
        });

        console.log('Registering Service Worker...');
        
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        console.log('Service Worker registered successfully:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('New Service Worker found');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              // New service worker activated, show update prompt
              const shouldReload = window.confirm(
                'A new version of Go BARRY is available! Would you like to refresh to get the latest features?'
              );
              
              if (shouldReload) {
                window.location.reload();
              }
            }
          });
        });

        // Handle controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('Service Worker controller changed');
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('Message from Service Worker:', event.data);
          
          // Handle specific message types
          if (event.data.type === 'ROADWORKS_UPDATED') {
            // Dispatch custom event for components to listen
            window.dispatchEvent(new CustomEvent('roadworks-cache-updated', {
              detail: { timestamp: event.data.timestamp }
            }));
          }
        });

        // Initial cache population
        if (registration.active) {
          console.log('Requesting initial cache population...');
          const messageChannel = new MessageChannel();
          
          messageChannel.port1.onmessage = (event) => {
            if (event.data.success) {
              console.log('Initial roadworks cache populated');
            }
          };

          registration.active.postMessage(
            { type: 'CACHE_ROADWORKS' },
            [messageChannel.port2]
          );
        }

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    registerServiceWorker();

    // Cleanup function
    return () => {
      // Service worker persists, no cleanup needed
    };
  }, []);

  return null; // No UI component needed
};

export default ServiceWorkerRegistration;