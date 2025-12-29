import { useEffect, useState } from 'react'
import { StatusCard } from '../components/StatusCard'
import { AlertBadge } from '../components/AlertBadge'
import { SiteStatusBadge } from '../components/SiteStatusBadge'
import { trpc } from '../lib/trpc'
import { RefreshCw } from 'lucide-react'

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(false)

  // Queries
  const statusGeral = trpc.monitoring.statusGeral.useQuery()
  const alertasAtivos = trpc.alerts.ativos.useQuery()
  const alertasEstatisticas = trpc.alerts.estatisticas.useQuery({ periodo: '24h' })

  const handleRefresh = async () => {
    setIsLoading(true)
    await Promise.all([
      statusGeral.refetch(),
      alertasAtivos.refetch(),
      alertasEstatisticas.refetch(),
    ])
    setIsLoading(false)
  }

  if (statusGeral.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const data = statusGeral.data
  const alertas = alertasAtivos.data || []
  const stats = alertasEstatisticas.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do status de todos os sites
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Total de Sites"
          value={data?.total || 0}
          status="neutral"
        />
        <StatusCard
          title="Online"
          value={data?.online || 0}
          status="success"
          trend={5}
        />
        <StatusCard
          title="Offline"
          value={data?.offline || 0}
          status="error"
          trend={-2}
        />
        <StatusCard
          title="Degradado"
          value={data?.degradado || 0}
          status="warning"
          trend={0}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertas Ativos */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Alertas Ativos</h2>
          {alertas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum alerta ativo no momento</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alertas.slice(0, 5).map((alerta) => (
                <div
                  key={alerta.id}
                  className="flex items-start justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertBadge severity={alerta.severidade} />
                      <span className="text-sm text-muted-foreground">
                        {new Date(alerta.criado_em).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    <p className="font-medium text-foreground">{alerta.titulo}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alerta.mensagem}
                    </p>
                  </div>
                  <button className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:opacity-90 transition-opacity">
                    Resolver
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estatísticas */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Estatísticas (24h)</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total de Alertas</p>
              <p className="text-2xl font-bold text-foreground">
                {stats?.total || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resolvidos</p>
              <p className="text-2xl font-bold text-green-600">
                {stats?.resolvidos || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ativos</p>
              <p className="text-2xl font-bold text-red-600">{stats?.ativos || 0}</p>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Por Severidade</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Crítica</span>
                  <span className="font-medium">
                    {stats?.porSeveridade?.critica || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Alta</span>
                  <span className="font-medium">
                    {stats?.porSeveridade?.alta || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Média</span>
                  <span className="font-medium">
                    {stats?.porSeveridade?.media || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Baixa</span>
                  <span className="font-medium">
                    {stats?.porSeveridade?.baixa || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sites Status */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Status dos Sites</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Site
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Uptime
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Tempo Resposta
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Última Verificação
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.sites?.map((site) => (
                <tr
                  key={site.id}
                  className="border-b border-border hover:bg-muted transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-foreground">
                    {site.nome}
                  </td>
                  <td className="py-3 px-4">
                    <SiteStatusBadge status={site.status} />
                  </td>
                  <td className="py-3 px-4 text-foreground">{site.uptime}%</td>
                  <td className="py-3 px-4 text-foreground">
                    {site.tempo_resposta}ms
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {site.verificado_em
                      ? new Date(site.verificado_em).toLocaleTimeString('pt-BR')
                      : '-'}
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
