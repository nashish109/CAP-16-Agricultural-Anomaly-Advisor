import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { TrendingDown, TrendingUp } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle: string
  change?: number
  changeLabel?: string
  icon: ReactNode
  iconBg?: string
  footerLink?: { label: string; to: string }
}

export function KpiCard({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  icon,
  iconBg = 'bg-brand-50 text-brand-700',
  footerLink,
}: KpiCardProps) {
  const positive = change !== undefined && change >= 0
  return (
    <div className="card-pro group relative overflow-hidden p-4 transition hover:border-brand-200/50 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{title}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
          <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
          {change !== undefined && (
            <div
              className={`mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${
                positive ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
              }`}
            >
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {positive ? '+' : ''}
              {change}% {changeLabel || ''}
            </div>
          )}
          {footerLink && (
            <Link
              to={footerLink.to}
              className="mt-2 inline-block text-xs font-medium text-brand-700 hover:text-brand-800 hover:underline"
            >
              {footerLink.label}
            </Link>
          )}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
