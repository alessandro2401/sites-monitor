import { useState } from 'react'
import { CheckCircle, Filter } from 'lucide-react'
import { AlertBadge } from '../components/AlertBadge'
import { trpc } from '../lib/trpc'

type SeveridadeFilter = 'todas' | 'baixa' | 'media' | 'alta' | 'critica'

export function Alerts() {
  const [severidadeFilter, setSeveridadeFilter] = useState<SeveridadeFilter>('todas')
  const [resolveLoading, setResolveLoading] = useState<string | null>(null)

  // Queries
  const alertasAtivos = trpc.alerts.ativos.useQuery()
  const alertasHistorico = trpc.alerts.historico.useQuery({ limite: 100 })
  const resolverAlerta = trpc.alerts.resolver.useMutation()

  const handleResolve = async (id: string) => {
    setResolveLoading(id)
    try {
      await resolverAlerta.mutateAsync({ id })
      await alertasAtivos.refetch()
      await alertasHistorico.refetch()
    } finally {
      setResolveLoading(null)
    }
  }

  const alertas = alertasAtivos.data || []
  const filteredAlertas =
    severidadeFilter === 'todas'
      ? alertas
      : alertas.filter((a) => a.severidade === severidadeFilter)

  if (alertasAtivos.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando alertas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Alertas</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie e resolva alertas de todos os sites
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={18} className="text-muted-foreground" />
        {(['todas', 'baixa', 'media', 'alta', 'critica'] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setSeveridadeFilter(sev)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              severidadeFilter === sev
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            {sev === 'todas' ? 'Todos' : sev.charAt(0).toUpperCase() + sev.slice(1)}
          </button>
        ))}
      </div>

      {/* Alertas Ativos */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            Alertas Ativos ({filteredAlertas.length})
          </h2>
        </div>

        {filteredAlertas.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum alerta ativo</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredAlertas.map((alerta) => (
              <div
                key={alerta.id}
                className="p-4 hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertBadge severity={alerta.severidade} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(alerta.criado_em).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {alerta.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {alerta.mensagem}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Tentativas de notificação: {alerta.tentativas_notificacao}
                    </p>
                  </div>
                  <button
                    onClick={() => handleResolve(alerta.id)}
                    disabled={resolveLoading === alerta.id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 ml-4"
                  >
                    <CheckCircle size={16} />
                    {resolveLoading === alerta.id ? 'Resolvendo...' : 'Resolver'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Histórico */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Histórico de Alertas</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Título
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Severidade
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {alertasHistorico.data?.slice(0, 20).map((alerta) => (
                <tr
                  key={alerta.id}
                  className="border-b border-border hover:bg-muted transition-colors"
                >
                  <td className="py-3 px-4 text-foreground">{alerta.titulo}</td>
                  <td className="py-3 px-4">
                    <AlertBadge severity={alerta.severidade} />
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        alerta.resolvido
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {alerta.resolvido ? 'Resolvido' : 'Aberto'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {new Date(alerta.criado_em).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
