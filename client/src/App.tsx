import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { Route, Router } from 'wouter'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Sites } from './pages/Sites'
import { Alerts } from './pages/Alerts'
import { trpc, trpcClient } from './lib/trpc'

const queryClient = new QueryClient()

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Layout>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/sites" component={Sites} />
            <Route path="/alerts" component={Alerts} />
            <Route path="/" component={Dashboard} />
          </Layout>
        </Router>
      </QueryClientProvider>
    </trpc.Provider>
  )
}
