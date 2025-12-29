interface AlertBadgeProps {
  severity: 'baixa' | 'media' | 'alta' | 'critica'
  label?: string
}

export function AlertBadge({ severity, label }: AlertBadgeProps) {
  const severityConfig = {
    baixa: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      icon: '🔵',
    },
    media: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      icon: '🟡',
    },
    alta: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      icon: '🟠',
    },
    critica: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: '🔴',
    },
  }

  const config = severityConfig[severity]

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
    >
      <span>{config.icon}</span>
      <span>{label || severity.toUpperCase()}</span>
    </span>
  )
}
