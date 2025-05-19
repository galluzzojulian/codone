import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initMonaco } from "./monaco-worker";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent duplicate requests in development
      retry: false,
      // Deduplicate requests made within this time window
      staleTime: 1000 * 60 * 15, // 15 minutes
      // Don't refetch on window focus
      refetchOnWindowFocus: false,
      // Deduplicate identical requests made within longer time
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

// Conditionally wrap with StrictMode only in production
// This prevents double rendering in development which can cause issues with complex state updates
const isDevelopment = import.meta.env.MODE === 'development';

const AppWithProviders = (
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

// Initialize Monaco editor
initMonaco();

createRoot(document.getElementById("root")!).render(
  isDevelopment ? AppWithProviders : <StrictMode>{AppWithProviders}</StrictMode>
);
