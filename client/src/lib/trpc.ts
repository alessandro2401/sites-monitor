import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../../../server/routers'

export const trpc = createTRPCReact<AppRouter>()

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000'}/api/trpc`,
      headers: async () => {
        const token = localStorage.getItem('auth_token')
        return {
          ...(token && { authorization: `Bearer ${token}` }),
        }
      },
    }),
  ],
})
