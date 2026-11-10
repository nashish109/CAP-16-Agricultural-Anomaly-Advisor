import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const styles = {
  success: 'bg-white border-gray-200 text-gray-800 shadow-lg ring-1 ring-emerald-500/20',
  error: 'bg-white border-gray-200 text-gray-800 shadow-lg ring-1 ring-red-500/20',
  info: 'bg-white border-gray-200 text-gray-800 shadow-lg ring-1 ring-sky-500/20',
  warning: 'bg-white border-gray-200 text-gray-800 shadow-lg ring-1 ring-amber-500/20',
}

const iconColors = {
  success: 'text-emerald-600',
  error: 'text-red-600',
  info: 'text-sky-600',
  warning: 'text-amber-600',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => {
          const Icon = icons[t.type]
          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${styles[t.type]}`}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColors[t.type]}`} />
              <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="opacity-60 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
