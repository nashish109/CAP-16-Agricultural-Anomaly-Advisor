import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react'
import { Loader2, X } from 'lucide-react'

export function Card({
  children,
  className = '',
  title,
  action,
  hover = false,
}: {
  children: ReactNode
  className?: string
  title?: string
  action?: ReactNode
  hover?: boolean
}) {
  return (
    <div
      className={`card-pro p-5 ${hover ? 'hover:border-brand-200/60' : ''} ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
          {title && (
            <h3 className="text-[0.9375rem] font-semibold tracking-tight text-gray-900">{title}</h3>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}) {
  const variants = {
    primary:
      'bg-brand-700 text-white hover:bg-brand-800 shadow-sm active:scale-[0.98]',
    secondary: 'bg-brand-50 text-brand-800 hover:bg-brand-100 border border-brand-100',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    outline: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-base rounded-lg',
    lg: 'px-6 py-3.5 text-lg rounded-xl',
  }
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

export function Input({
  label,
  error,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-base font-medium text-gray-700">{label}</span>}
      <input
        className={`input-pro w-full rounded-lg px-3.5 py-2.5 text-base text-gray-900 placeholder:text-gray-400 ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  )
}

export function Select({
  label,
  error,
  children,
  className = '',
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <select
        className={`input-pro w-full rounded-lg px-3.5 py-2.5 text-sm text-gray-900 ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}) {
  const tones = {
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10',
    warning: 'bg-amber-50 text-amber-800 ring-1 ring-amber-600/10',
    danger: 'bg-red-50 text-red-700 ring-1 ring-red-600/10',
    info: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/10',
    neutral: 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/5',
  }
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200/70 ${className}`} />
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
        <div className="h-6 w-6 rounded-md border-2 border-dashed border-gray-300" />
      </div>
      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-gray-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        className="relative z-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6"
        style={{ boxShadow: 'var(--shadow-elevated)' }}
      >
        <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function statusTone(status?: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const s = (status || '').toUpperCase()
  if (s === 'HEALTHY' || s === 'SUCCESS' || s === 'COMPLETED') return 'success'
  if (s === 'MODERATE' || s === 'WARNING' || s === 'PENDING') return 'warning'
  if (s === 'ATTENTION' || s === 'CRITICAL' || s === 'DANGER') return 'danger'
  return 'neutral'
}
