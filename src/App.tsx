import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import RouteStructure from './components/routing/RouteStructure';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import { register as registerSW } from './utils/serviceWorker';
import './App.css';

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

  useEffect(() => {
    // Enregistrer le service worker pour PWA
    registerSW({
      onSuccess: (registration) => {
        console.log('Service Worker enregistré avec succès:', registration);
      },
      onUpdate: (registration) => {
        console.log('Nouvelle version disponible:', registration);
        // Optionnel: afficher une notification à l'utilisateur
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <RouteStructure />
        <PWAInstallPrompt />
      </Layout>
    </QueryClientProvider>
  );
}

export default App;
