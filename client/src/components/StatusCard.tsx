import { AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react'

interface StatusCardProps {
  title: string
  value: string | number
  status?: 'success' | 'warning' | 'error' | 'neutral'
  icon?: React.ReactNode
  trend?: number
}

export function StatusCard({
  title,
  value,
  status = 'neutral',
  icon,
  trend,
}: StatusCardProps) {
  const statusColors = {
    success: 'bg-green-50 text-green-900 border-green-200',
    warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
    error: 'bg-red-50 text-red-900 border-red-200',
    neutral: 'bg-blue-50 text-blue-900 border-blue-200',
  }

  const statusIcons = {
    success: <CheckCircle size={24} className="text-green-600" />,
    warning: <Clock size={24} className="text-yellow-600" />,
    error: <AlertCircle size={24} className="text-red-600" />,
    neutral: <TrendingUp size={24} className="text-blue-600" />,
  }

  return (
    <div
      className={`p-6 rounded-lg border ${statusColors[status]} transition-all hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend !== undefined && (
            <p className="text-sm mt-2 opacity-75">
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs período anterior
            </p>
          )}
        </div>
        <div>{icon || statusIcons[status]}</div>
      </div>
    </div>
  )
}
