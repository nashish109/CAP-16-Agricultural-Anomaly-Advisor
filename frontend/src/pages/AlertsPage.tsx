import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  Bug,
  CheckCircle2,
  CloudRain,
  Droplets,
  Info,
} from 'lucide-react'
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Select,
  Skeleton,
  statusTone,
} from '../components/ui'
import { alertService } from '../services'
import type { Alert, AlertSeverity } from '../types'

const demoAlerts: Alert[] = [
  {
    id: 1,
    title: 'Low soil moisture — Chili Terrace',
    description: 'Moisture dropped to 28%. Irrigation recommended within 6 hours.',
    severity: 'CRITICAL',
    type: 'irrigation',
    read: false,
    timestamp: '2026-09-03T06:15:00Z',
  },
  {
    id: 2,
    title: 'Rainfall advisory for Jaffna',
    description: 'Thunderstorms likely Thursday afternoon. Secure hay stacks and delay spraying.',
    severity: 'WARNING',
    type: 'weather',
    read: false,
    timestamp: '2026-09-03T05:40:00Z',
  },
  {
    id: 3,
    title: 'Possible fungal risk on tomato',
    description: 'Humidity above 80% for 36h. Scout for early blight lesions.',
    severity: 'WARNING',
    type: 'disease',
    read: true,
    timestamp: '2026-09-02T18:20:00Z',
  },
  {
    id: 4,
    title: 'Sensor battery low — Field 2',
    description: 'Maize Ridge soil probe battery at 15%. Replace soon.',
    severity: 'INFO',
    type: 'sensor',
    read: true,
    timestamp: '2026-09-02T14:05:00Z',
  },
  {
    id: 5,
    title: 'Irrigation cycle completed',
    description: 'North Paddy Block received 45 minutes of drip irrigation.',
    severity: 'SUCCESS',
    type: 'irrigation',
    read: true,
    timestamp: '2026-09-02T09:30:00Z',
  },
]

const severityIcon = {
  CRITICAL: Bug,
  WARNING: AlertTriangle,
  INFO: Info,
  SUCCESS: CheckCircle2,
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

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [severity, setSeverity] = useState<AlertSeverity | 'ALL'>('ALL')

  useEffect(() => {
    let cancelled = false
    alertService
      .getAll()
      .then((data) => {
        if (!cancelled) setAlerts(data.length ? data : demoAlerts)
      })
      .catch(() => {
        if (!cancelled) setAlerts(demoAlerts)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(
    () => (severity === 'ALL' ? alerts : alerts.filter((a) => a.severity === severity)),
    [alerts, severity]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts & Notifications"
        subtitle="Operational warnings, weather advisories, and system events"
        actions={
          <Select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as AlertSeverity | 'ALL')}
            className="min-w-[160px]"
          >
            <option value="ALL">All severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
            <option value="SUCCESS">Success</option>
          </Select>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !filtered.length ? (
        <Card>
          <EmptyState
            title="No alerts"
            description="You're all caught up. New notifications will show here."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const Icon =
              alert.type?.toLowerCase().includes('irrigation')
                ? Droplets
                : alert.type?.toLowerCase().includes('weather')
                  ? CloudRain
                  : severityIcon[alert.severity] || Bell

            const border =
              alert.severity === 'CRITICAL'
                ? 'border-red-100 bg-red-50/60'
                : alert.severity === 'WARNING'
                  ? 'border-amber-100 bg-amber-50/50'
                  : alert.severity === 'SUCCESS'
                    ? 'border-brand-100 bg-brand-50/50'
                    : 'border-blue-100 bg-blue-50/40'

            return (
              <Card key={alert.id} className={`border ${border}`}>
                <div className="flex gap-4">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                    <Icon className="h-5 w-5 text-gray-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                      <Badge tone={statusTone(alert.severity)}>{alert.severity}</Badge>
                      {!alert.read && <Badge tone="info">New</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{alert.description}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                      <span>{formatTime(alert.timestamp)}</span>
                      <span className="capitalize">{alert.type}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
