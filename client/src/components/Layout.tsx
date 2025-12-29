import { useState } from 'react'
import { Menu, X, BarChart3, AlertCircle, Settings, LogOut } from 'lucide-react'
import { Link, useLocation } from 'wouter'

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [location] = useLocation()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/sites', label: 'Sites', icon: BarChart3 },
    { href: '/monitoring', label: 'Monitoramento', icon: BarChart3 },
    { href: '/alerts', label: 'Alertas', icon: AlertCircle },
    { href: '/reports', label: 'Relatórios', icon: BarChart3 },
    { href: '/settings', label: 'Configurações', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-card border-r border-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-primary">SitesMonitor</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location === item.href
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span>{item.label}</span>}
                </a>
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="px-4 py-4 border-t border-border">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-foreground">
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center px-6">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-lg font-semibold text-foreground">
              Painel de Monitoramento
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-background">
          <div className="container py-6">{children}</div>
        </div>
      </main>
    </div>
  )
}
