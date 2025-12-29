interface SiteStatusBadgeProps {
  status: 'online' | 'offline' | 'timeout' | 'error' | 'unknown'
  label?: string
}

export function SiteStatusBadge({ status, label }: SiteStatusBadgeProps) {
  const statusConfig = {
    online: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      dot: 'bg-green-600',
      icon: '✓',
    },
    offline: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      dot: 'bg-red-600',
      icon: '✕',
    },
    timeout: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      dot: 'bg-yellow-600',
      icon: '⏱',
    },
    error: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      dot: 'bg-orange-600',
      icon: '⚠',
    },
    unknown: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      dot: 'bg-gray-600',
      icon: '?',
    },
  }

  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
      <span>{label || status.toUpperCase()}</span>
    </span>
  )
}
