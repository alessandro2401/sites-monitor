import { router } from './trpc'
import { sitesRouter } from './routers/sites'
import { monitoringRouter } from './routers/monitoring'
import { alertsRouter } from './routers/alerts'

export const appRouter = router({
  sites: sitesRouter,
  monitoring: monitoringRouter,
  alerts: alertsRouter,
})

export type AppRouter = typeof appRouter
