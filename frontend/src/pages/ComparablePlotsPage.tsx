import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  GitCompareArrows,
  Loader2,
  Sprout,
  Users,
} from 'lucide-react'
import { anomalyService } from '../services'
import type { AnomalyBatch, ComparablePlotRow } from '../types'

const MINIMUM_PEERS = 3

function metric(value: number | null | undefined, suffix = ''): string {
  if (value == null || !Number.isFinite(Number(value))) return '—'
  return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`
}

function BenchmarkCard({
  title,
  target,
  median,
  peerCount,
  unit,
}: {
  title: string
  target: number | null
  median: number | null
  peerCount: number
  unit: string
}) {
  const sufficient = peerCount >= MINIMUM_PEERS && median != null && median > 0
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Selected plot</div>
          <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
            {metric(target, unit)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Peer median</div>
          <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
            {sufficient ? metric(median, unit) : 'Unavailable'}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-700">
        <span className="text-slate-500 dark:text-slate-400">Independent peer values</span>
        <span className="font-semibold text-slate-700 dark:text-slate-200">{peerCount}</span>
      </div>
      {!sufficient && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          At least {MINIMUM_PEERS} valid peer values and a positive median are required.
        </p>
      )}
    </div>
  )
}

export default function ComparablePlotsPage() {
  const [batches, setBatches] = useState<AnomalyBatch[]>([])
  const [batchId, setBatchId] = useState('')
  const [rows, setRows] = useState<ComparablePlotRow[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState('')
  const [loadingBatches, setLoadingBatches] = useState(true)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoadingBatches(true)
    anomalyService.getBatches()
      .then((result) => {
        if (!active) return
        setBatches(result)
        if (result.length > 0) setBatchId(result[0].batch_id)
      })
      .catch(() => {
        if (active) setError('Unable to load dataset batches. Please try again.')
      })
      .finally(() => {
        if (active) setLoadingBatches(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!batchId) {
      setRows([])
      setSelectedRecordId('')
      return
    }

    let active = true
    setLoadingAnalysis(true)
    setError('')
    setRows([])
    setSelectedRecordId('')

    anomalyService.getComparablePlots(batchId)
      .then((result) => {
        if (active) setRows(result)
      })
      .catch(() => {
        if (active) setError('Unable to load comparable plot analysis for this batch.')
      })
      .finally(() => {
        if (active) setLoadingAnalysis(false)
      })

    return () => { active = false }
  }, [batchId])

  const targets = useMemo(() => {
    const grouped = new Map<string, ComparablePlotRow[]>()
    rows.forEach((row) => {
      const existing = grouped.get(row.record_id) || []
      existing.push(row)
      grouped.set(row.record_id, existing)
    })
    return Array.from(grouped.entries()).map(([recordId, values]) => ({
      recordId,
      rows: values,
      target: values[0],
    }))
  }, [rows])

  useEffect(() => {
    if (targets.length > 0 && !targets.some((item) => item.recordId === selectedRecordId)) {
      setSelectedRecordId(targets[0].recordId)
    }
  }, [targets, selectedRecordId])

  const selected = targets.find((item) => item.recordId === selectedRecordId)
  const target = selected?.target
  const peers = useMemo(() => {
    if (!selected) return []
    const unique = new Map<string, ComparablePlotRow>()
    selected.rows.forEach((row) => {
      if (row.peer_plot_id == null) return
      const key = `${row.peer_farm_id ?? ''}:${row.peer_plot_id}`
      unique.set(key, row)
    })
    return Array.from(unique.values())
  }, [selected])

  const selectedBatch = batches.find((batch) => batch.batch_id === batchId)

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <GitCompareArrows size={21} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Comparable Plot Analysis</h1>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Inspect the independent plots behind each CAP-16 benchmark. Comparisons use the same
            owner, crop, variety, season and soil type, with repeated uploads consolidated per plot.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <Users size={15} />
          Minimum {MINIMUM_PEERS} independent peers
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <label htmlFor="comparable-batch" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Dataset batch
        </label>
        <select
          id="comparable-batch"
          value={batchId}
          onChange={(event) => setBatchId(event.target.value)}
          disabled={loadingBatches || batches.length === 0}
          className="w-full max-w-2xl rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        >
          {batches.length === 0 && <option value="">No batches available</option>}
          {batches.map((batch) => (
            <option key={batch.batch_id} value={batch.batch_id}>
              {batch.source_file_name} · {batch.batch_id.slice(0, 8)} · {batch.processing_status}
            </option>
          ))}
        </select>
        {selectedBatch && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {selectedBatch.total_records} records · {selectedBatch.created_at ? new Date(selectedBatch.created_at).toLocaleString() : 'Date unavailable'}
          </p>
        )}
      </section>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {loadingBatches || loadingAnalysis ? (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-12 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <Loader2 className="animate-spin" size={20} />
          {loadingBatches ? 'Loading dataset batches…' : 'Calculating independent peer comparisons…'}
        </div>
      ) : targets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <Sprout className="mx-auto text-slate-400" size={30} />
          <h2 className="mt-3 font-semibold text-slate-800 dark:text-white">No valid target records found</h2>
          <p className="mx-auto mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">
            This batch has no valid agricultural records available for comparable-plot analysis.
          </p>
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
              <BarChart3 size={17} />
              Select a target plot record
            </div>
            <select
              value={selectedRecordId}
              onChange={(event) => setSelectedRecordId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              {targets.map(({ recordId, target: item }) => (
                <option key={recordId} value={recordId}>
                  {item.crop} · Farm {item.farm_id ?? '—'} / Plot {item.plot_id ?? '—'} · Record {recordId}
                </option>
              ))}
            </select>
            {target && (
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>Crop: <strong className="text-slate-700 dark:text-slate-200">{target.crop}</strong></span>
                <span>Variety: <strong className="text-slate-700 dark:text-slate-200">{target.crop_variety || 'Not specified'}</strong></span>
                <span>Season: <strong className="text-slate-700 dark:text-slate-200">{target.season}</strong></span>
                <span>Soil: <strong className="text-slate-700 dark:text-slate-200">{target.soil_type}</strong></span>
              </div>
            )}
          </section>

          {target && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <BenchmarkCard title="Fertilizer (kg/ha)" target={target.target_fertilizer_value} median={target.median_fertilizer} peerCount={target.fertilizer_peer_count} unit="" />
                <BenchmarkCard title="Water (L/ha)" target={target.target_water_value} median={target.median_water} peerCount={target.water_peer_count} unit="" />
                <BenchmarkCard title="Yield (tonnes/ha)" target={target.target_yield_value} median={target.median_yield} peerCount={target.yield_peer_count} unit="" />
              </div>

              {target.peer_plot_count < MINIMUM_PEERS && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  Only {target.peer_plot_count} independent comparable plot(s) were found. CAP-16 requires at least {MINIMUM_PEERS}; treat the benchmark as insufficient rather than a reliable anomaly comparison.
                </div>
              )}

              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="border-b border-slate-200 p-4 dark:border-slate-700">
                  <h2 className="font-semibold text-slate-900 dark:text-white">Independent peer plots</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {peers.length} distinct peer plot(s). The selected plot itself and duplicate uploads are excluded from the peer list.
                  </p>
                </div>
                {peers.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No independent peer plots match this target's agricultural context.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-3">Peer farm</th>
                          <th className="px-4 py-3">Peer plot</th>
                          <th className="px-4 py-3 text-right">Fertilizer kg/ha</th>
                          <th className="px-4 py-3 text-right">Water L/ha</th>
                          <th className="px-4 py-3 text-right">Yield tonnes/ha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {peers.map((peer) => (
                          <tr key={`${peer.peer_farm_id}:${peer.peer_plot_id}`} className="text-slate-700 dark:text-slate-200">
                            <td className="whitespace-nowrap px-4 py-3">{peer.peer_farm_id ?? '—'}</td>
                            <td className="whitespace-nowrap px-4 py-3 font-medium">{peer.peer_plot_id ?? '—'}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{metric(peer.peer_fertilizer_value)}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{metric(peer.peer_water_value)}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{metric(peer.peer_yield_value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}

      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Method: peer plots are matched on owner, crop, crop variety, season and soil type. Multiple valid
        records for the same farm and plot are consolidated using their average metric values; the
        benchmark is the median across independent peer plots. A deviation is an observation, not proof
        that an input caused a yield outcome.
      </p>
    </div>
  )
}
