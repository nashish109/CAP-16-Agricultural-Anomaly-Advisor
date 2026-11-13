
import { useEffect, useState } from 'react'
import {
  Database,
  Sprout,
  CheckCircle2,
  TriangleAlert,
  Activity,
  FileSpreadsheet,
  Clock3,
  RefreshCw,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'

import { dashboardService } from '../services'
import type { DashboardAnalytics } from '../types'

const SEVERITY_COLORS: Record<string, string> = {
  HIGH: '#ef4444',
  CRITICAL: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#eab308',
  INFO: '#0ea5e9',
}

const QUALITY_COLORS = {
  valid: '#16a34a',
  nonValid: '#f59e0b',
}

interface KpiItem {
  title: string
  value: string
  subtitle: string
  icon: LucideIcon
}

function formatNumber(
  value: number | string | null | undefined
): string {
  if (value == null || value === '') return '—'

  const numericValue =
    typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(numericValue)) return '—'

  return numericValue.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusClass(status: string): string {
  const normalized = status.toUpperCase()

  if (normalized === 'SUCCESS' || normalized === 'PROCESSED') {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (
    normalized === 'FAILED' ||
    normalized === 'ERROR' ||
    normalized === 'REJECTED'
  ) {
    return 'bg-red-50 text-red-700'
  }

  if (
    normalized === 'PROCESSING' ||
    normalized === 'PENDING' ||
    normalized === 'PARTIAL'
  ) {
    return 'bg-amber-50 text-amber-700'
  }

  return 'bg-gray-100 text-gray-700'
}

function getSeverityClass(severity: string): string {
  switch (severity.toUpperCase()) {
    case 'HIGH':
    case 'CRITICAL':
      return 'bg-red-50 text-red-700'

    case 'MEDIUM':
      return 'bg-amber-50 text-amber-700'

    case 'LOW':
      return 'bg-yellow-50 text-yellow-700'

    default:
      return 'bg-sky-50 text-sky-700'
  }
}

function KpiCard({
  item,
}: {
  item: KpiItem
}) {
  const Icon = item.icon

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">
          {item.title}
        </p>

        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
          <Icon size={21} />
        </div>
      </div>

      <h2 className="mt-3 text-3xl font-bold text-gray-900">
        {item.value}
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        {item.subtitle}
      </p>
    </div>
  )
}

function MetricCard({
  title,
  value,
  unit,
  description,
}: {
  title: string
  value: number | string | null
  unit: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">
        {title}
      </p>

      <div className="mt-3 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold text-gray-900">
          {formatNumber(value)}
        </h3>

        <span className="text-xs text-gray-500">
          {unit}
        </span>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {description}
      </p>
    </div>
  )
}

function EmptyState({
  message,
}: {
  message: string
}) {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-lg border border-dashed border-gray-200 px-4 text-center text-sm text-gray-500">
      {message}
    </div>
  )
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadAnalytics() {
    try {
      setLoading(true)
      setError(null)

      const response = await dashboardService.getAnalytics()

      /*
       * Spring Boot wraps the FastAPI response in ApiResponse.
       * Axios removes the outer wrapper, leaving:
       * { success, role, data: { ...analytics } }.
       *
       * Support both that structure and a directly returned
       * analytics object.
       */
      const responseEnvelope = response as unknown as {
        data?: {
          datasets?: DashboardAnalytics['datasets']
          records?: DashboardAnalytics['records']
          anomaly_distribution?: DashboardAnalytics['anomaly_distribution']
          recent_datasets?: DashboardAnalytics['recent_datasets']
          recent_anomalies?: DashboardAnalytics['recent_anomalies']
        }
      }

      const result = responseEnvelope.data ?? response

      if (!result || !result.datasets || !result.records) {
        throw new Error('The analytics API returned an unexpected response.')
      }

      setAnalytics(result as DashboardAnalytics)
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load agricultural analytics.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <RefreshCw size={30} className="animate-spin text-emerald-600" />

        <p className="text-sm font-medium text-gray-600">
          Loading agricultural analytics...
        </p>

        <p className="text-xs text-gray-400">
          Retrieving processed data from Snowflake
        </p>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Agricultural Intelligence Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor agricultural inputs, dataset quality and yield anomalies.
          </p>
        </div>

        <div className="rounded-xl border border-red-100 bg-red-50 p-6">
          <div className="flex items-center gap-2 text-red-700">
            <TriangleAlert size={21} />

            <h3 className="font-semibold">
              Unable to load dashboard analytics
            </h3>
          </div>

          <p className="mt-3 text-sm text-red-700">
            {error || 'No analytics data was returned by the server.'}
          </p>

          <button
            onClick={() => void loadAnalytics()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { datasets, records } = analytics

  const totalAnomalies = analytics.anomaly_distribution.reduce(
    (total, item) => total + Number(item.anomaly_count || 0),
    0
  )

  const totalQualityRecords =
    records.valid_quality_records + records.non_valid_quality_records

  const validPercentage =
    totalQualityRecords > 0
      ? (records.valid_quality_records / totalQualityRecords) * 100
      : 0

  const nonValidPercentage =
    totalQualityRecords > 0
      ? (records.non_valid_quality_records / totalQualityRecords) * 100
      : 0

  const severityTotals = analytics.anomaly_distribution.reduce<
    Record<string, number>
  >((totals, item) => {
    const severity = String(item.severity || 'UNKNOWN').toUpperCase()

    totals[severity] =
      (totals[severity] || 0) + Number(item.anomaly_count || 0)

    return totals
  }, {})

  const anomalyChartData = Object.entries(severityTotals).map(
    ([name, value]) => ({
      name,
      value,
      color: SEVERITY_COLORS[name] || '#64748b',
    })
  )

  const kpis: KpiItem[] = [
    {
      title: 'Datasets Processed',
      value: formatNumber(datasets.total_datasets),
      subtitle: 'Uploaded agricultural datasets',
      icon: Database,
    },
    {
      title: 'Agricultural Records',
      value: formatNumber(records.total_agricultural_records),
      subtitle: 'Records stored in Snowflake',
      icon: Sprout,
    },
    {
      title: 'Valid Records',
      value: formatNumber(records.valid_quality_records),
      subtitle: `${validPercentage.toFixed(1)}% of classified records`,
      icon: CheckCircle2,
    },
    {
      title: 'Anomalies Detected',
      value: formatNumber(totalAnomalies),
      subtitle: 'Recorded anomaly indicators',
      icon: TriangleAlert,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Dashboard heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Agricultural Intelligence Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor agricultural inputs, dataset quality and yield anomalies.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Live Snowflake Analytics
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <KpiCard key={item.title} item={item} />
        ))}
      </div>

      {/* Agricultural input metrics */}
      <section>
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">
            Agricultural Input Consumption
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Average normalized input consumption per hectare from stored agricultural records.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Fertilizer"
            value={records.avg_fertilizer_kg_per_hectare}
            unit="kg/ha"
            description="Average fertilizer consumption"
          />

          <MetricCard
            title="Seeds"
            value={records.avg_seed_kg_per_hectare}
            unit="kg/ha"
            description="Average seed consumption"
          />

          <MetricCard
            title="Water"
            value={records.avg_water_liters_per_hectare}
            unit="L/ha"
            description="Average water consumption"
          />

          <MetricCard
            title="Recorded Yield"
            value={records.avg_yield_tonnes_ha}
            unit="tonnes/ha"
            description="Average recorded crop yield"
          />
        </div>
      </section>

      {/* Anomaly distribution and data quality */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">
            Anomaly Overview
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Distribution of recorded anomalies by severity.
          </p>

          {anomalyChartData.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="h-64 w-full max-w-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={anomalyChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      label
                    >
                      {anomalyChartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>

                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {anomalyChartData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3"
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />

                    <span className="text-sm text-gray-600">
                      {item.name}
                    </span>

                    <strong className="text-sm text-gray-900">
                      {item.value}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState message="No anomaly records are currently available." />
          )}
        </section>

        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">
            Data Quality Summary
          </h3>

          <p className="mb-6 mt-1 text-sm text-gray-500">
            Quality classification of agricultural records.
          </p>

          {totalQualityRecords > 0 ? (
            <>
              <div className="mb-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-600">
                    Valid records
                  </span>

                  <strong className="text-gray-900">
                    {validPercentage.toFixed(1)}%
                  </strong>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${validPercentage}%`,
                      backgroundColor: QUALITY_COLORS.valid,
                    }}
                  />
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  {formatNumber(records.valid_quality_records)} records
                </p>
              </div>

              <div className="mb-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-600">
                    Non-valid records
                  </span>

                  <strong className="text-gray-900">
                    {nonValidPercentage.toFixed(1)}%
                  </strong>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${nonValidPercentage}%`,
                      backgroundColor: QUALITY_COLORS.nonValid,
                    }}
                  />
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  {formatNumber(records.non_valid_quality_records)} records
                </p>
              </div>
            </>
          ) : (
            <EmptyState message="No quality-classified agricultural records are available." />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs text-amber-700">
                Missing harvest
              </p>

              <p className="mt-1 text-xl font-bold text-amber-800">
                {formatNumber(datasets.missing_harvest_records)}
              </p>
            </div>

            <div className="rounded-lg bg-sky-50 p-3">
              <p className="text-xs text-sky-700">
                Missing yield
              </p>

              <p className="mt-1 text-xl font-bold text-sky-800">
                {formatNumber(datasets.missing_yield_records)}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Processing summary */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="text-emerald-700" />

          <div>
            <h3 className="font-semibold text-gray-900">
              Dataset Processing Summary
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Aggregated processing results from uploaded batches.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Total records',
              value: datasets.total_records,
            },
            {
              label: 'Complete records',
              value: datasets.complete_records,
            },
            {
              label: 'Incomplete records',
              value: datasets.incomplete_records,
            },
            {
              label: 'Duplicate records',
              value: datasets.duplicate_records,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg bg-gray-50 p-4"
            >
              <p className="text-sm text-gray-500">
                {item.label}
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatNumber(item.value)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent anomalies */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              Recent Anomaly Indicators
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Latest recorded indicators requiring investigation.
            </p>
          </div>

          <TriangleAlert className="text-amber-600" />
        </div>

        {analytics.recent_anomalies.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {analytics.recent_anomalies.map((item) => (
              <div
                key={item.anomaly_id}
                className="rounded-lg border border-gray-100 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm text-gray-900">
                    Plot {item.plot_id}
                  </strong>

                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${getSeverityClass(item.severity)}`}
                  >
                    {item.severity}
                  </span>
                </div>

                <p className="mt-3 text-sm font-medium text-gray-800">
                  {item.crop} · {item.season}
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  {item.anomaly_type.replace(/_/g, ' ')}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Metric: {item.metric_name}
                </p>

                
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded bg-gray-50 p-2">
                    <p className="text-gray-500">Observed</p>
                    <strong className="text-gray-800">
                      {formatNumber(item.observed_value)}
                    </strong>
                  </div>

                  <div className="rounded bg-gray-50 p-2">
                    <p className="text-gray-500">Expected</p>
                    <strong className="text-gray-800">
                      {item.anomaly_type === 'INSUFFICIENT_DATA'
                        ? 'N/A'
                        : formatNumber(item.expected_value)}
                    </strong>
                  </div>
                </div>

                {item.anomaly_type !== 'INSUFFICIENT_DATA' &&
                  item.deviation_percentage != null && (
                    <p className="mt-2 text-xs font-medium text-gray-700">
                      Deviation: {formatNumber(item.deviation_percentage)}%
                    </p>
                )}


                <p className="mt-3 text-sm text-gray-500">
                  {item.explanation}
                </p>

                <p className="mt-3 text-xs text-gray-400">
                  {formatDate(item.detected_at)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No recent anomaly indicators are available." />
        )}
      </section>

      {/* Recent dataset activity */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              Recent Dataset Activity
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Latest agricultural dataset ingestion and processing records.
            </p>
          </div>

          <Activity className="text-emerald-700" />
        </div>

        {analytics.recent_datasets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-3 pr-4">Dataset</th>
                  <th className="py-3 pr-4">Records</th>
                  <th className="py-3 pr-4">Valid</th>
                  <th className="py-3 pr-4">Incomplete</th>
                  <th className="py-3 pr-4">Duplicates</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {analytics.recent_datasets.map((item) => (
                  <tr
                    key={item.batch_id}
                    className="border-b last:border-0"
                  >
                    <td className="py-4 pr-4 font-medium text-gray-800">
                      <FileSpreadsheet
                        className="mr-2 inline text-emerald-700"
                        size={17}
                      />

                      {item.source_file_name}
                    </td>

                    <td className="py-4 pr-4 text-gray-600">
                      {formatNumber(item.total_records)}
                    </td>

                    <td className="py-4 pr-4 text-gray-600">
                      {formatNumber(item.valid_records)}
                    </td>

                    <td className="py-4 pr-4 text-gray-600">
                      {formatNumber(item.incomplete_records)}
                    </td>

                    <td className="py-4 pr-4 text-gray-600">
                      {formatNumber(item.duplicate_records)}
                    </td>

                    <td className="py-4 pr-4 text-gray-600">
                      {formatDate(item.created_at)}
                    </td>

                    <td className="py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(item.processing_status)}`}
                      >
                        {item.processing_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No dataset processing activity is available." />
        )}
      </section>

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-sky-50 p-3 text-xs text-sky-800">
        <Clock3 size={16} />

        Metrics are retrieved from Snowflake agricultural records and dataset batches.
        Comparisons across different crop cycles or growing conditions require
        appropriate cohort filtering.
      </div>
    </div>
  )
}
