import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { Route, Router } from 'wouter'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Sites } from './pages/Sites'
import { Alerts } from './pages/Alerts'
import { trpc, trpcClient } from './lib/trpc'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import { useAuth } from './contexts/AuthContext'

const queryClient = new QueryClient()

function ProtectedApp() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Login />
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

export default function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  )
}
