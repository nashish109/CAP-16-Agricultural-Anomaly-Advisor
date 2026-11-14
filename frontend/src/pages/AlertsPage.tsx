
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  Bug,
  CheckCircle2,
  CloudRain,
  Droplets,
  Info,
  Database,
  TrendingDown,
  Activity,
} from 'lucide-react'

import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
  statusTone,
} from '../components/ui'

import { alertService, anomalyService } from '../services'

import type {
  Alert,
  AlertSeverity,
  AnomalyAssessment,
  AnomalyBatch,
  AnomalyRecommendation,
} from '../types'

const severityIcon = {
  CRITICAL: Bug,
  WARNING: AlertTriangle,
  INFO: Info,
  SUCCESS: CheckCircle2,
}

function formatTime(ts: string | null) {
  if (!ts) return 'Date unavailable'

  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ts
  }
}

function formatMetric(value: number | null, suffix = '') {
  if (value == null || !Number.isFinite(Number(value))) {
    return 'N/A'
  }

  return `${Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}${suffix}`
}

function getAnomalyLabel(type: string) {
  const labels: Record<string, string> = {
    EXCESS_FERTILIZER: 'Excess fertilizer consumption',
    EXCESS_WATER: 'Excess water consumption',
    LOW_CROP_YIELD: 'Lower-than-expected crop yield',
    INSUFFICIENT_DATA: 'Insufficient comparison data',
  }

  return labels[type] || type.replaceAll('_', ' ')
}

function getMetricUnit(metric: string) {
  if (metric === 'FERTILIZER_KG_PER_HECTARE') return ' kg/ha'
  if (metric === 'WATER_LITERS_PER_HECTARE') return ' L/ha'
  if (metric === 'YIELD_TONNES_HA') return ' t/ha'
  return ''
}

function getSeverityTone(severity: string) {
  if (severity === 'HIGH') return 'danger'
  if (severity === 'MEDIUM') return 'warning'
  return 'info'
}

function OperationalAlertCard({ alert }: { alert: Alert }) {
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
    <Card className={`border ${border}`}>
      <div className="flex gap-4">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
          <Icon className="h-5 w-5 text-gray-700" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              {alert.title}
            </h3>

            <Badge tone={statusTone(alert.severity)}>
              {alert.severity}
            </Badge>
            <Badge tone="info">DEMO DATA</Badge>
            {!alert.read && <Badge tone="info">New</Badge>}
          </div>

          <p className="mt-1 text-sm text-gray-600">
            {alert.description}
          </p>

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
            <span>{formatTime(alert.timestamp)}</span>
            <span className="capitalize">{alert.type}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function AnomalyCard({ assessment }: { assessment: AnomalyAssessment }) {
  const insufficient = assessment.anomaly_type === 'INSUFFICIENT_DATA'
  const unit = getMetricUnit(assessment.metric_name)

  const border = insufficient
    ? 'border-blue-100 bg-blue-50/30'
    : assessment.severity === 'HIGH'
      ? 'border-red-100 bg-red-50/40'
      : 'border-amber-100 bg-amber-50/30'

  return (
    <Card className={`border ${border}`}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                {getAnomalyLabel(assessment.anomaly_type)}
              </h3>

              <Badge tone={getSeverityTone(assessment.severity)}>
                {assessment.severity}
              </Badge>

              {insufficient && (
                <Badge tone="info">Not enough evidence</Badge>
              )}
            </div>

            <p className="mt-1 text-sm text-gray-600">
              {assessment.crop} Â· Plot {assessment.plot_id || 'N/A'}
            </p>
          </div>

          <span className="text-xs text-gray-400">
            {formatTime(assessment.detected_at)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-white/80 p-3">
            <p className="text-xs text-gray-500">Observed</p>
            <p className="mt-1 font-semibold text-gray-900">
              {formatMetric(assessment.observed_value, unit)}
            </p>
          </div>

          <div className="rounded-lg bg-white/80 p-3">
            <p className="text-xs text-gray-500">Expected</p>
            <p className="mt-1 font-semibold text-gray-900">
              {insufficient
                ? 'N/A'
                : formatMetric(assessment.expected_value, unit)}
            </p>
          </div>

          <div className="rounded-lg bg-white/80 p-3">
            <p className="text-xs text-gray-500">Deviation</p>
            <p className="mt-1 font-semibold text-gray-900">
              {insufficient
                ? 'N/A'
                : formatMetric(assessment.deviation_percentage, '%')}
            </p>
          </div>

          <div className="rounded-lg bg-white/80 p-3">
            <p className="text-xs text-gray-500">Metric</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {assessment.metric_name.replaceAll('_', ' ')}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-white/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Assessment explanation
          </p>

          <p className="mt-1 text-sm leading-relaxed text-gray-700">
            {assessment.explanation}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
          <span>Season: {assessment.season}</span>
          <span>Soil: {assessment.soil_type}</span>
          <span>Farm: {assessment.farm_id || 'N/A'}</span>
          <span>Batch: {assessment.batch_id}</span>
        </div>
      </div>
    </Card>
  )
}


function RecommendationCard({
  recommendation,
}: {
  recommendation: AnomalyRecommendation
}) {
  const priority = recommendation.priority?.toUpperCase() || 'INFO'
  const tone =
    priority === 'HIGH' || priority === 'CRITICAL'
      ? 'danger'
      : priority === 'MEDIUM' || priority === 'WARNING'
        ? 'warning'
        : 'info'

  return (
    <Card className="border border-brand-100 bg-brand-50/30">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                {recommendation.title}
              </h3>
              <Badge tone={tone}>{priority} PRIORITY</Badge>
              <Badge tone="info">
                {recommendation.anomaly_type.replaceAll('_', ' ')}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {recommendation.crop} · Plot {recommendation.plot_id || 'N/A'}
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-gray-700">
          {recommendation.recommendation}
        </p>

        {recommendation.observed_value != null && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-white/80 p-3">
              <p className="text-xs text-gray-500">Observed</p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatMetric(
                  recommendation.observed_value,
                  getMetricUnit(recommendation.metric_name)
                )}
              </p>
            </div>
            <div className="rounded-lg bg-white/80 p-3">
              <p className="text-xs text-gray-500">Peer median</p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatMetric(
                  recommendation.expected_value,
                  getMetricUnit(recommendation.metric_name)
                )}
              </p>
            </div>
            <div className="rounded-lg bg-white/80 p-3">
              <p className="text-xs text-gray-500">Deviation</p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatMetric(recommendation.deviation_percentage, '%')}
              </p>
            </div>
          </div>
        )}

        {recommendation.suggested_actions.length > 0 && (
          <div className="rounded-lg bg-white/80 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Suggested actions
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              {recommendation.suggested_actions.map((action, index) => (
                <li key={`${recommendation.anomaly_id || recommendation.batch_id}-${index}`}>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommendation.rationale && (
          <div className="rounded-lg bg-white/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Assessment rationale
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-700">
              {recommendation.rationale}
            </p>
          </div>
        )}

        <p className="text-xs leading-relaxed text-gray-500">
          {recommendation.advisory_note}
        </p>
      </div>
    </Card>
  )
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity | 'ALL'>('ALL')
  const [alertLoading, setAlertLoading] = useState(true)
  const [alertError, setAlertError] = useState('')

  const [batches, setBatches] = useState<AnomalyBatch[]>([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [batchLoading, setBatchLoading] = useState(true)
  const [batchError, setBatchError] = useState('')

  const [assessments, setAssessments] = useState<AnomalyAssessment[]>([])
  const [assessmentLoading, setAssessmentLoading] = useState(true)
  const [assessmentError, setAssessmentError] = useState('')

  const [recommendations, setRecommendations] = useState<AnomalyRecommendation[]>([])
  const [recommendationLoading, setRecommendationLoading] = useState(true)
  const [recommendationError, setRecommendationError] = useState('')

  // Load existing PostgreSQL operational alerts and Snowflake batch list.
  useEffect(() => {
    let cancelled = false

    alertService
      .getAll()
      .then((data) => {
        if (!cancelled) setAlerts(data)
      })
      .catch(() => {
        if (!cancelled) {
          setAlertError('Unable to load operational notifications.')
        }
      })
      .finally(() => {
        if (!cancelled) setAlertLoading(false)
      })

    anomalyService
      .getBatches()
      .then((data) => {
        if (!cancelled) setBatches(data)
      })
      .catch(() => {
        if (!cancelled) {
          setBatchError('Unable to load dataset batches from Snowflake.')
        }
      })
      .finally(() => {
        if (!cancelled) setBatchLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Retrieve assessments whenever the selected batch changes.
  useEffect(() => {
    let cancelled = false

    setAssessmentLoading(true)
    setAssessmentError('')
    setAssessments([])

    anomalyService
      .getAssessments(selectedBatch || undefined)
      .then((data) => {
        if (!cancelled) setAssessments(data)
      })
      .catch(() => {
        if (!cancelled) {
          setAssessmentError(
            'Unable to retrieve anomaly assessments. Please try again.'
          )
        }
      })
      .finally(() => {
        if (!cancelled) setAssessmentLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedBatch])

  // Retrieve contextual recommendations whenever the selected batch changes.
  useEffect(() => {
    let cancelled = false

    setRecommendationLoading(true)
    setRecommendationError('')
    setRecommendations([])

    anomalyService
      .getRecommendations(selectedBatch || undefined)
      .then((data) => {
        if (!cancelled) setRecommendations(data)
      })
      .catch(() => {
        if (!cancelled) {
          setRecommendationError(
            'Unable to retrieve agricultural recommendations. Please try again.'
          )
        }
      })
      .finally(() => {
        if (!cancelled) setRecommendationLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedBatch])

  const filteredAlerts = useMemo(
    () =>
      alertSeverity === 'ALL'
        ? alerts
        : alerts.filter((alert) => alert.severity === alertSeverity),
    [alerts, alertSeverity]
  )

  const genuineAnomalies = useMemo(
    () =>
      assessments.filter(
        (assessment) => assessment.anomaly_type !== 'INSUFFICIENT_DATA'
      ),
    [assessments]
  )

  const insufficientAssessments = useMemo(
    () =>
      assessments.filter(
        (assessment) => assessment.anomaly_type === 'INSUFFICIENT_DATA'
      ),
    [assessments]
  )

  const highCount = genuineAnomalies.filter(
    (assessment) => assessment.severity === 'HIGH'
  ).length

  const mediumCount = genuineAnomalies.filter(
    (assessment) => assessment.severity === 'MEDIUM'
  ).length

  const selectedBatchDetails = batches.find(
    (batch) => batch.batch_id === selectedBatch
  )

  return (
    <div className="space-y-8">
      <PageHeader
        title="Alerts & Agricultural Anomaly Assessments"
        subtitle="Operational notifications and Snowflake-backed agricultural intelligence"
      />

      {/* AGRICULTURAL ANOMALY ASSESSMENTS */}
      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Agricultural Anomaly Assessments
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Independent-plot comparisons of fertilizer, water and crop yield.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-gray-500" />

            <select
              value={selectedBatch}
              onChange={(event) => setSelectedBatch(event.target.value)}
              disabled={batchLoading || batches.length === 0}
              className="min-w-0 max-w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">All batches</option>

              {batches.map((batch) => (
                <option key={batch.batch_id} value={batch.batch_id}>
                  {batch.source_file_name || batch.batch_id}
                  {' â€” '}
                  {batch.total_records} records
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedBatchDetails && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
            <span className="font-medium">Selected dataset:</span>{' '}
            {selectedBatchDetails.source_file_name}
            <span className="mx-2">Â·</span>
            {selectedBatchDetails.total_records} records
            <span className="mx-2">Â·</span>
            {selectedBatchDetails.processing_status}
          </div>
        )}

        {batchError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {batchError}
          </div>
        )}

        {assessmentError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {assessmentError}
          </div>
        )}

        {assessmentLoading || batchLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Card>
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Total assessments</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {assessments.length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-xs text-gray-500">Genuine anomalies</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {genuineAnomalies.length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-xs text-gray-500">HIGH / MEDIUM</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {highCount} / {mediumCount}
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">Insufficient data</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {insufficientAssessments.length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {assessments.length === 0 ? (
              <Card>
                <EmptyState
                  title="No anomaly assessments found"
                  description={
                    selectedBatch
                      ? 'This batch has no persisted anomaly or insufficient-data assessments.'
                      : 'No anomaly assessments are available for your accessible datasets.'
                  }
                />
              </Card>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">
                      Genuine agricultural anomalies
                    </h3>
                    <Badge tone="warning">
                      {genuineAnomalies.length} assessments
                    </Badge>
                  </div>

                  {genuineAnomalies.length === 0 ? (
                    <Card>
                      <EmptyState
                        title="No genuine anomalies detected"
                        description="No fertilizer, water or yield deviations crossed the configured detection thresholds."
                      />
                    </Card>
                  ) : (
                    genuineAnomalies.map((assessment) => (
                      <AnomalyCard
                        key={assessment.anomaly_id}
                        assessment={assessment}
                      />
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">
                      Insufficient comparison data
                    </h3>
                    <Badge tone="info">
                      {insufficientAssessments.length} assessments
                    </Badge>
                  </div>

                  {insufficientAssessments.length === 0 ? (
                    <Card>
                      <EmptyState
                        title="No insufficient-data assessments"
                        description="All assessed metrics had enough comparable data."
                      />
                    </Card>
                  ) : (
                    insufficientAssessments.map((assessment) => (
                      <AnomalyCard
                        key={assessment.anomaly_id}
                        assessment={assessment}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </>
        )}
      </section>

      {/* CAP-16 AGRICULTURAL RECOMMENDATIONS */}
      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Agricultural Recommendations
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Practical decision-support actions generated from persisted anomaly assessments.
            </p>
          </div>
          <Badge tone="success">
            {recommendations.length} recommendations
          </Badge>
        </div>

        {recommendationError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {recommendationError}
          </div>
        )}

        {recommendationLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-32" />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <Card>
            <EmptyState
              title="No recommendations available"
              description={
                selectedBatch
                  ? 'No recommendations were generated for this dataset batch.'
                  : 'Recommendations will appear here when anomaly assessments are available.'
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <RecommendationCard
                key={`${recommendation.anomaly_id || recommendation.batch_id || 'recommendation'}-${index}`}
                recommendation={recommendation}
              />
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500">
          Recommendations are decision-support guidance based on observed
          comparisons. They do not establish causation or replace local
          agronomic advice.
        </p>
      </section>

      {/* EXISTING OPERATIONAL NOTIFICATIONS */}
      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Operational Alerts & Notifications
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm font-semibold text-blue-800">
                  Demonstration notifications
                </p>
                <p className="mt-1 text-sm text-blue-700">
                  These notifications are seeded sample data for demonstration purposes.
                  They are not generated from live sensors, weather services, or
                  real-time agricultural events.
                </p>
              </div>
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Irrigation, weather, disease and sensor notifications.
            </p>
          </div>

          <select
            value={alertSeverity}
            onChange={(event) =>
              setAlertSeverity(
                event.target.value as AlertSeverity | 'ALL'
              )
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm outline-none focus:border-brand-500"
          >
            <option value="ALL">All severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
            <option value="SUCCESS">Success</option>
          </select>
        </div>

        {alertError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {alertError}
          </div>
        )}

        {alertLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <Card>
            <EmptyState
              title="No operational notifications"
              description="No notifications are available for the selected severity."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <OperationalAlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
