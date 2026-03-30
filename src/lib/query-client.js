// FILE: src/lib/query-client.js
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// ✅ Compatibilidade: se algum arquivo importar queryClientInstance, também funciona
export const queryClientInstance = queryClient