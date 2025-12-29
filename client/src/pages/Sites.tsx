import { useState } from 'react'
import { Plus, Edit2, Trash2, Play } from 'lucide-react'
import { SiteStatusBadge } from '../components/SiteStatusBadge'
import { trpc } from '../lib/trpc'

export function Sites() {
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    url: '',
    tipo: 'corretora' as const,
    endpoint_health: '',
    email_responsavel: '',
  })

  // Queries
  const sites = trpc.sites.list.useQuery()
  const createSite = trpc.sites.create.useMutation()
  const updateSite = trpc.sites.update.useMutation()
  const deleteSite = trpc.sites.delete.useMutation()
  const testSite = trpc.sites.test.useMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingId) {
      await updateSite.mutateAsync({
        id: editingId,
        data: formData,
      })
    } else {
      await createSite.mutateAsync(formData)
    }

    await sites.refetch()
    setShowModal(false)
    setFormData({
      nome: '',
      url: '',
      tipo: 'corretora',
      endpoint_health: '',
      email_responsavel: '',
    })
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este site?')) {
      await deleteSite.mutateAsync({ id })
      await sites.refetch()
    }
  }

  const handleTest = async (id: string) => {
    await testSite.mutateAsync({ id })
  }

  if (sites.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando sites...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Sites</h1>
          <p className="text-muted-foreground mt-1">
            Adicione e gerencie os sites a serem monitorados
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null)
            setFormData({
              nome: '',
              url: '',
              tipo: 'corretora',
              endpoint_health: '',
              email_responsavel: '',
            })
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={18} />
          Novo Site
        </button>
      </div>

      {/* Sites Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Nome
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  URL
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Tipo
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {sites.data?.map((site) => (
                <tr
                  key={site.id}
                  className="border-b border-border hover:bg-muted transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-foreground">
                    {site.nome}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {site.url}
                  </td>
                  <td className="py-3 px-4 text-foreground capitalize">
                    {site.tipo}
                  </td>
                  <td className="py-3 px-4">
                    <SiteStatusBadge
                      status={site.ativo ? 'online' : 'offline'}
                      label={site.ativo ? 'Ativo' : 'Inativo'}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTest(site.id)}
                        className="p-2 hover:bg-muted rounded transition-colors"
                        title="Testar conexão"
                      >
                        <Play size={16} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(site.id)
                          setFormData({
                            nome: site.nome,
                            url: site.url,
                            tipo: site.tipo,
                            endpoint_health: site.endpoint_health,
                            email_responsavel: site.email_responsavel || '',
                          })
                          setShowModal(true)
                        }}
                        className="p-2 hover:bg-muted rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} className="text-yellow-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(site.id)}
                        className="p-2 hover:bg-muted rounded transition-colors"
                        title="Deletar"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {editingId ? 'Editar Site' : 'Novo Site'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tipo
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipo: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="corretora">Corretora</option>
                  <option value="consorcio">Consórcio</option>
                  <option value="seguros">Seguros</option>
                  <option value="holding">Holding</option>
                  <option value="comunidade">Comunidade</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Endpoint Health Check
                </label>
                <input
                  type="url"
                  value={formData.endpoint_health}
                  onChange={(e) =>
                    setFormData({ ...formData, endpoint_health: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email Responsável
                </label>
                <input
                  type="email"
                  value={formData.email_responsavel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email_responsavel: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  {editingId ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
