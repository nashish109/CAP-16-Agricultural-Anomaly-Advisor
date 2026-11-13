
import {
  useEffect,
  useMemo,
  useState,
  type ElementType,
} from 'react'

import {
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Activity,
  Copy,
  CalendarDays,
  BarChart3,
  RefreshCw,
  Loader2,
  ChevronDown,
} from 'lucide-react'

import {
  dataQualityService,
  type DataQualityReport,
  type QualityRecord,
} from '../services/dataQualityService'

function formatNumber(value: number | null | undefined): string {
  return Number(value ?? 0).toLocaleString()
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString()
}

function formatValue(
  value: string | number | null | undefined
): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
}

function statusClass(status: string): string {
  switch (status.toUpperCase()) {
    case 'VALID':
      return 'bg-emerald-50 text-emerald-700'

    case 'INCOMPLETE':
      return 'bg-amber-50 text-amber-700'

    case 'DUPLICATE':
      return 'bg-orange-50 text-orange-700'

    default:
      return 'bg-gray-100 text-gray-700'
  }
}

function QualityCard({
  label,
  value,
  description,
  icon: Icon,
  color,
  background,
}: {
  label: string
  value: string | number
  description: string
  icon: ElementType
  color: string
  background: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">
          {label}
        </p>

        <div className={`rounded-lg p-2 ${background} ${color}`}>
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-3 text-3xl font-bold text-gray-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        {description}
      </p>
    </div>
  )
}

function RecordRow({ record }: { record: QualityRecord }) {
  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
        {record.farm_id}
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
        {record.plot_id}
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
        {record.crop}
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
        {record.season}
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
        {formatValue(record.yield_tonnes_ha)}
      </td>

      <td className="whitespace-nowrap px-4 py-3">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
            record.quality_status
          )}`}
        >
          {record.quality_status}
        </span>
      </td>

      <td className="min-w-56 px-4 py-3 text-sm text-gray-600">
        {record.quality_issues.length > 0 ? (
          <ul className="list-inside list-disc space-y-1">
            {record.quality_issues.map((issue, index) => (
              <li key={`${record.record_id}-${index}`}>
                {issue}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-emerald-700">
            No quality issues
          </span>
        )}
      </td>

      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
        {record.source_file_name}
      </td>
    </tr>
  )
}

export default function DataQualityPage() {
  const [report, setReport] = useState<DataQualityReport | null>(null)
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadReport() {
      try {
        setError(null)

        if (report === null) {
          setLoading(true)
        } else {
          setRefreshing(true)
        }

        const result = await dataQualityService.getReport(
          selectedBatchId || undefined
        )

        if (!cancelled) {
          setReport(result)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : 'Unable to load agricultural quality data.'

          setError(message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    loadReport()

    return () => {
      cancelled = true
    }
  }, [selectedBatchId, refreshCounter])

  const summary = report?.summary

  const completeness = summary?.completeness_percentage ?? 0
  const qualityScore = summary?.quality_score ?? 0

  const cropDistribution = useMemo(
    () => report?.crop_distribution ?? [],
    [report]
  )

  const maxCropCount = Math.max(
    1,
    ...cropDistribution.map((item) => item.count)
  )

  const records = report?.records ?? []

  const qualityCards = [
    {
      label: 'Total Records',
      value: formatNumber(summary?.total_records),
      description: 'Persisted agricultural records',
      icon: Database,
      color: 'text-blue-600',
      background: 'bg-blue-50',
    },
    {
      label: 'Missing Values',
      value: formatNumber(summary?.missing_values),
      description: 'Missing values in nullable stored fields',
      icon: AlertTriangle,
      color: 'text-amber-600',
      background: 'bg-amber-50',
    },
    {
      label: 'Duplicate Records',
      value: formatNumber(summary?.duplicate_records),
      description: 'Duplicate agricultural observations',
      icon: Copy,
      color: 'text-orange-600',
      background: 'bg-orange-50',
    },
    {
      label: 'Incomplete Records',
      value: formatNumber(summary?.incomplete_records),
      description: 'Records missing harvest or yield information',
      icon: XCircle,
      color: 'text-red-600',
      background: 'bg-red-50',
    },
  ]

  if (loading) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-emerald-600" size={32} />

        <p className="text-sm text-gray-500">
          Loading agricultural quality information...
        </p>
      </div>
    )
  }

  if (error && !report) {
    return (
      <div className="space-y-4 pb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Data Quality & Profiling
        </h1>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={20} />

            <p className="font-semibold">
              Unable to load quality report
            </p>
          </div>

          <p className="mt-2 text-sm text-red-700">
            {error}
          </p>

          <button
            onClick={() => setRefreshCounter((count) => count + 1)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!report || report.batches.length === 0) {
    return (
      <div className="space-y-6 pb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Data Quality & Profiling
          </h1>

          <p className="mt-1 text-gray-500">
            Inspect agricultural datasets for completeness,
            consistency and duplicate observations.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <Database
            size={42}
            className="mx-auto text-gray-300"
          />

          <h2 className="mt-4 font-semibold text-gray-800">
            No agricultural datasets found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Upload a CSV dataset to view its actual quality
            statistics and record-level profiling.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Data Quality & Profiling
          </h1>

          <p className="mt-1 text-gray-500">
            Inspect agricultural datasets for completeness,
            consistency, duplicates and quality issues.
          </p>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <Activity size={14} />
            Live Snowflake-backed agricultural data
          </div>
        </div>

        <button
          onClick={() => setRefreshCounter((count) => count + 1)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Batch selection */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Dataset selection
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Select an uploaded dataset or view all available batches.
            </p>
          </div>

          <div className="relative min-w-0 sm:w-80">
            <select
              value={selectedBatchId}
              onChange={(event) => setSelectedBatchId(event.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-9 text-sm text-gray-700 outline-none focus:border-emerald-500"
            >
              <option value="">
                All available datasets
              </option>

              {report.batches.map((batch) => (
                <option
                  key={batch.batch_id}
                  value={batch.batch_id}
                >
                  {batch.source_file_name} — {batch.batch_id.slice(0, 8)}
                </option>
              ))}
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Quality cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {qualityCards.map((card) => (
          <QualityCard
            key={card.label}
            label={card.label}
            value={card.value}
            description={card.description}
            icon={card.icon}
            color={card.color}
            background={card.background}
          />
        ))}
      </div>

      {/* Quality score and checks */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-1">
          <h2 className="font-semibold text-gray-900">
            Overall Quality Score
          </h2>

          <div className="mt-6 flex items-center justify-center">
            <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-[12px] border-emerald-100">
              <span className="text-4xl font-bold text-emerald-700">
                {qualityScore.toFixed(1)}%
              </span>

              <span className="text-xs text-gray-500">
                Valid records
              </span>
            </div>
          </div>

          <p className="mt-5 text-center text-sm text-gray-500">
            Calculated as valid persisted records divided by
            total persisted records.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <h2 className="font-semibold text-gray-900">
            Data Quality Checks
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Quality measurements calculated from Snowflake records.
          </p>

          <div className="mt-5 space-y-5">
            <div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">
                  Nullable-field completeness
                </span>

                <span className="text-gray-500">
                  {completeness.toFixed(2)}%
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, completeness))}%`,
                  }}
                />
              </div>

              <p className="mt-1 text-xs text-gray-500">
                Based on {summary?.nullable_fields_checked ?? 0} nullable
                fields in the persisted record schema.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-600" size={20} />

                <div>
                  <p className="text-sm font-medium text-gray-800">
                    CAP-16 schema reference
                  </p>

                  <p className="text-xs text-gray-500">
                    Expected input fields
                  </p>
                </div>
              </div>

              <span className="text-sm font-semibold text-emerald-700">
                {report.schema.length} fields
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-amber-600" size={20} />

                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Missing nullable values
                  </p>

                  <p className="text-xs text-gray-500">
                    Across persisted nullable fields
                  </p>
                </div>
              </div>

              <span className="text-sm font-semibold text-amber-700">
                {formatNumber(summary?.missing_values)} found
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3">
                <Copy className="text-orange-600" size={20} />

                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Duplicate observations
                  </p>

                  <p className="text-xs text-gray-500">
                    Duplicate status assigned by the processor
                  </p>
                </div>
              </div>

              <span className="text-sm font-semibold text-orange-700">
                {formatNumber(summary?.duplicate_records)} found
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="text-red-600" size={20} />

                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Incomplete observations
                  </p>

                  <p className="text-xs text-gray-500">
                    Missing harvest date or crop yield
                  </p>
                </div>
              </div>

              <span className="text-sm font-semibold text-red-700">
                {formatNumber(summary?.incomplete_records)} found
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Crop distribution */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-emerald-600" size={20} />

          <h2 className="font-semibold text-gray-900">
            Crop Distribution
          </h2>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          Number of persisted agricultural records for each crop.
        </p>

        {cropDistribution.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500">
            No crop distribution information is available.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {cropDistribution.map((item) => (
              <div key={item.crop}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.crop}
                  </span>

                  <span className="font-medium text-gray-900">
                    {formatNumber(item.count)} records
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{
                      width: `${(item.count / maxCropCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dataset history */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <Database className="text-emerald-600" size={20} />

          <h2 className="font-semibold text-gray-900">
            Dataset History
          </h2>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          Upload batches recorded in Snowflake.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                  File
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                  Date
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                  Total
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                  Valid
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                  Incomplete
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                  Duplicates
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {report.batches.map((batch) => (
                <tr
                  key={batch.batch_id}
                  className="border-t border-gray-100"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {batch.source_file_name}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(batch.created_at)}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatNumber(batch.total_records)}
                  </td>

                  <td className="px-4 py-3 text-sm text-emerald-700">
                    {formatNumber(batch.valid_records)}
                  </td>

                  <td className="px-4 py-3 text-sm text-amber-700">
                    {formatNumber(batch.incomplete_records)}
                  </td>

                  <td className="px-4 py-3 text-sm text-orange-700">
                    {formatNumber(batch.duplicate_records)}
                  </td>

                  <td className="px-4 py-3 text-sm">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {batch.processing_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual record details */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="text-emerald-600" size={20} />

          <h2 className="font-semibold text-gray-900">
            Record-Level Quality Details
          </h2>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          Individual persisted records and their quality classifications.
        </p>

        {report.records_truncated && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Showing the first 5,000 records. Summary statistics
            include all matching persisted records.
          </div>
        )}

        {records.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500">
            No persisted agricultural records are available.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    'Farm',
                    'Plot',
                    'Crop',
                    'Season',
                    'Yield (t/ha)',
                    'Quality Status',
                    'Quality Issues',
                    'Source File',
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-xs font-semibold uppercase text-gray-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <RecordRow
                    key={record.record_id}
                    record={record}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CAP-16 schema reference */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="text-emerald-600" size={20} />

          <h2 className="font-semibold text-gray-900">
            CAP-16 Input Schema
          </h2>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          Reference fields defined by the CropRecord validation model.
          This is not a reconstruction of the original CSV headers.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {report.schema.map((field) => (
            <div
              key={field.name}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
            >
              <span className="break-all text-sm text-gray-700">
                {field.name}
              </span>

              <span
                className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                  field.required
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {field.required ? 'Required' : 'Optional'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Profiling summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-gray-900">
          Profiling Summary
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Findings calculated from the selected Snowflake dataset.
        </p>

        <div className="mt-5 space-y-3 text-sm">
          <div className="rounded-lg bg-emerald-50 p-4 text-emerald-900">
            <strong>Valid records:</strong>{' '}
            {formatNumber(summary?.valid_records)} observations passed
            the processor's completeness and duplicate checks.
          </div>

          <div className="rounded-lg bg-amber-50 p-4 text-amber-900">
            <strong>Missing values:</strong>{' '}
            {formatNumber(summary?.missing_values)} null values were found
            across the five nullable stored fields.
          </div>

          <div className="rounded-lg bg-orange-50 p-4 text-orange-900">
            <strong>Duplicate observations:</strong>{' '}
            {formatNumber(summary?.duplicate_records)} observations were
            classified as duplicates by the processing engine.
          </div>

          <div className="rounded-lg bg-red-50 p-4 text-red-900">
            <strong>Incomplete observations:</strong>{' '}
            {formatNumber(summary?.incomplete_records)} observations
            require harvest-date or yield information.
          </div>

          <div className="rounded-lg bg-gray-50 p-4 text-gray-700">
            <strong>Rejected CSV rows:</strong> These are stored separately
            in S3 and are not included in the persisted Snowflake record
            statistics displayed here.
          </div>
        </div>
      </div>
    </div>
  )
}
