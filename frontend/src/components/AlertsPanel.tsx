import { AlertTriangle, CheckCircle2, CloudRain, Droplets, Bug } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, Skeleton } from './ui'
import type { Alert } from '../types'

const severityConfig = {
  CRITICAL: { icon: Bug, color: 'bg-red-50 text-red-600 border-red-100' },
  WARNING: { icon: AlertTriangle, color: 'bg-orange-50 text-orange-600 border-orange-100' },
  INFO: { icon: CloudRain, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  SUCCESS: { icon: CheckCircle2, color: 'bg-brand-50 text-brand-600 border-brand-100' },
}

function formatTime(ts: string) {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ts
  }
}

export default function AlertsPanel({ alerts, loading }: { alerts?: Alert[]; loading?: boolean }) {
  return (
    <Card
      title="Alerts & Notifications"
      action={
        <Link to="/alerts">
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </Link>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : !alerts?.length ? (
        <EmptyState title="No alerts" description="You're all caught up." />
      ) : (
        <div className="space-y-2.5">
          {alerts.slice(0, 4).map((alert) => {
            const cfg = severityConfig[alert.severity] || severityConfig.INFO
            const Icon = alert.type?.toLowerCase().includes('irrigation')
              ? Droplets
              : alert.type?.toLowerCase().includes('weather')
                ? CloudRain
                : cfg.icon
            return (
              <div key={alert.id} className={`flex gap-3 rounded-xl border p-3 ${cfg.color}`}>
                <div className="mt-0.5 shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                  <p className="mt-0.5 text-xs text-gray-600">{alert.description}</p>
                  <p className="mt-1 text-[11px] text-gray-400">{formatTime(alert.timestamp)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
