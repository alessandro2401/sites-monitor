import { initTRPC, TRPCError } from '@trpc/server'
import { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import { db } from './db'

export interface Context {
  user?: {
    id: string
    email: string
    role: 'admin' | 'monitor' | 'viewer'
  }
}

export const createContext = async (opts: CreateExpressContextOptions): Promise<Context> => {
  // Extrair usuário do JWT token (será implementado com OAuth)
  const authHeader = opts.req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {}
  }

  try {
    // Aqui você decodificaria o JWT token
    // Por enquanto, retornar contexto vazio
    return {}
  } catch (error) {
    return {}
  }
}

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(async (opts) => {
  if (!opts.ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Não autenticado',
    })
  }
  return opts.next({
    ctx: {
      user: opts.ctx.user,
    },
  })
})

export const adminProcedure = protectedProcedure.use(async (opts) => {
  if (opts.ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Acesso negado',
    })
  }
  return opts.next()
})

export const monitorProcedure = protectedProcedure.use(async (opts) => {
  if (opts.ctx.user.role !== 'admin' && opts.ctx.user.role !== 'monitor') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Acesso negado',
    })
  }
  return opts.next()
})
