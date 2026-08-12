import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SemesterProvider } from './contexts/SemesterContext';
import App from './App';
import './index.css';

/**
 * Entry point — wraps App with required providers:
 * - QueryClientProvider: React Query for data fetching/caching
 * - SemesterProvider: Active semester context (tech-spec Section 2.3)
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SemesterProvider>
        <App />
      </SemesterProvider>
    </QueryClientProvider>
  </StrictMode>
);
