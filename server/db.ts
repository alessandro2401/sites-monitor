import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../drizzle/schema'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const db = drizzle(pool, { schema })

// ============================================================================
// QUERY HELPERS
// ============================================================================

export const queries = {
  // SITES
  sites: {
    getAll: async () => {
      return db.query.sites.findMany({
        where: (sites, { isNull }) => isNull(sites.deletado_em),
        orderBy: (sites, { asc }) => asc(sites.nome),
      })
    },

    getById: async (id: string) => {
      return db.query.sites.findFirst({
        where: (sites, { eq }) => eq(sites.id, id),
      })
    },

    getActive: async () => {
      return db.query.sites.findMany({
        where: (sites, { eq, isNull }) => ({
          ativo: eq(sites.ativo, true),
          deletado_em: isNull(sites.deletado_em),
        }),
      })
    },

    getByType: async (tipo: string) => {
      return db.query.sites.findMany({
        where: (sites, { eq, isNull }) => ({
          tipo: eq(sites.tipo, tipo as any),
          deletado_em: isNull(sites.deletado_em),
        }),
      })
    },
  },

  // HEALTH CHECKS
  healthChecks: {
    getLatest: async (siteId: string) => {
      return db.query.healthChecks.findFirst({
        where: (hc, { eq }) => eq(hc.site_id, siteId),
        orderBy: (hc, { desc }) => desc(hc.verificado_em),
      })
    },

    getHistory: async (siteId: string, horas: number = 24) => {
      const dataInicio = new Date(Date.now() - horas * 60 * 60 * 1000)
      return db.query.healthChecks.findMany({
        where: (hc, { eq, gte }) => ({
          site_id: eq(hc.site_id, siteId),
          verificado_em: gte(hc.verificado_em, dataInicio),
        }),
        orderBy: (hc, { desc }) => desc(hc.verificado_em),
      })
    },

    getByStatus: async (status: string) => {
      return db.query.healthChecks.findMany({
        where: (hc, { eq }) => eq(hc.status, status as any),
        orderBy: (hc, { desc }) => desc(hc.verificado_em),
        limit: 100,
      })
    },
  },

  // ALERTAS
  alertas: {
    getActive: async (siteId?: string) => {
      const where = siteId
        ? (alertas: any, { eq }: any) => ({
            resolvido: eq(alertas.resolvido, false),
            site_id: eq(alertas.site_id, siteId),
          })
        : (alertas: any, { eq }: any) => eq(alertas.resolvido, false)

      return db.query.alertas.findMany({
        where,
        orderBy: (alertas, { desc }) => desc(alertas.criado_em),
      })
    },

    getHistory: async (siteId?: string, limite: number = 50) => {
      const where = siteId
        ? (alertas: any, { eq }: any) => eq(alertas.site_id, siteId)
        : undefined

      return db.query.alertas.findMany({
        where,
        orderBy: (alertas, { desc }) => desc(alertas.criado_em),
        limit: limite,
      })
    },

    getBySeverity: async (severidade: string) => {
      return db.query.alertas.findMany({
        where: (alertas, { eq }) => eq(alertas.severidade, severidade as any),
        orderBy: (alertas, { desc }) => desc(alertas.criado_em),
      })
    },
  },

  // USUARIOS
  usuarios: {
    getByEmail: async (email: string) => {
      return db.query.usuarios.findFirst({
        where: (usuarios, { eq }) => eq(usuarios.email, email),
      })
    },

    getAll: async () => {
      return db.query.usuarios.findMany({
        where: (usuarios, { eq }) => eq(usuarios.ativo, true),
        orderBy: (usuarios, { asc }) => asc(usuarios.nome),
      })
    },

    getByRole: async (role: string) => {
      return db.query.usuarios.findMany({
        where: (usuarios, { eq }) => eq(usuarios.role, role as any),
      })
    },
  },

  // AUDIT LOG
  auditLog: {
    getRecent: async (limite: number = 100) => {
      return db.query.auditLog.findMany({
        orderBy: (log, { desc }) => desc(log.criado_em),
        limit: limite,
      })
    },

    getByUsuario: async (usuarioId: string) => {
      return db.query.auditLog.findMany({
        where: (log, { eq }) => eq(log.usuario_id, usuarioId),
        orderBy: (log, { desc }) => desc(log.criado_em),
      })
    },
  },
}
