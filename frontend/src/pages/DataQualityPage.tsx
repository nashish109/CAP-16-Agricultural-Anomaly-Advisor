
import { useMemo } from 'react'
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
} from 'lucide-react'

type DatasetRecord = {
  farm_id: string
  plot_id: string
  crop: string
  season: string
  soil_type: string
  sowing_date: string
  harvest_date: string
  fertilizer_kg: number | null
  seed_kg: number | null
  water_liters: number | null
  yield_tonnes_ha: number | null
}

const records: DatasetRecord[] = [
  {
    farm_id: 'F001', plot_id: 'P001', crop: 'Paddy',
    season: 'Kharif', soil_type: 'Clay',
    sowing_date: '2026-06-10', harvest_date: '2026-10-15',
    fertilizer_kg: 120, seed_kg: 35, water_liters: 45000,
    yield_tonnes_ha: 4.8,
  },
  {
    farm_id: 'F001', plot_id: 'P002', crop: 'Maize',
    season: 'Kharif', soil_type: 'Loamy',
    sowing_date: '2026-06-12', harvest_date: '2026-10-20',
    fertilizer_kg: 90, seed_kg: 25, water_liters: 32000,
    yield_tonnes_ha: 3.9,
  },
  {
    farm_id: 'F002', plot_id: 'P003', crop: 'Wheat',
    season: 'Rabi', soil_type: 'Clay',
    sowing_date: '2026-11-01', harvest_date: '2027-03-15',
    fertilizer_kg: 110, seed_kg: 30, water_liters: 28000,
    yield_tonnes_ha: 4.2,
  },
  {
    farm_id: 'F002', plot_id: 'P004', crop: 'Paddy',
    season: 'Kharif', soil_type: '',
    sowing_date: '2026-06-15', harvest_date: '2026-10-18',
    fertilizer_kg: 130, seed_kg: 32, water_liters: 48000,
    yield_tonnes_ha: 5.1,
  },
  {
    farm_id: 'F003', plot_id: 'P005', crop: 'Maize',
    season: 'Kharif', soil_type: 'Loamy',
    sowing_date: '2026-06-20', harvest_date: '2026-10-25',
    fertilizer_kg: null, seed_kg: 28, water_liters: 35000,
    yield_tonnes_ha: 4.0,
  },
  {
    farm_id: 'F001', plot_id: 'P002', crop: 'Maize',
    season: 'Kharif', soil_type: 'Loamy',
    sowing_date: '2026-06-12', harvest_date: '2026-10-20',
    fertilizer_kg: 90, seed_kg: 25, water_liters: 32000,
    yield_tonnes_ha: 3.9,
  },
  {
    farm_id: 'F003', plot_id: 'P006', crop: 'Wheat',
    season: 'Rabi', soil_type: 'Clay',
    sowing_date: '2026-11-05', harvest_date: '2026-03-10',
    fertilizer_kg: -10, seed_kg: 30, water_liters: 26000,
    yield_tonnes_ha: 4.1,
  },
  {
    farm_id: 'F004', plot_id: 'P007', crop: 'Tomato',
    season: 'Rabi', soil_type: 'Sandy',
    sowing_date: '2026-11-10', harvest_date: '',
    fertilizer_kg: 75, seed_kg: 12, water_liters: 18000,
    yield_tonnes_ha: null,
  },
  {
    farm_id: 'F004', plot_id: 'P008', crop: 'Chili',
    season: 'Kharif', soil_type: 'Red',
    sowing_date: '2026-06-08', harvest_date: '2026-10-10',
    fertilizer_kg: 85, seed_kg: 15, water_liters: 20000,
    yield_tonnes_ha: 2.8,
  },
]

const fields: (keyof DatasetRecord)[] = [
  'farm_id', 'plot_id', 'crop', 'season', 'soil_type',
  'sowing_date', 'harvest_date', 'fertilizer_kg',
  'seed_kg', 'water_liters', 'yield_tonnes_ha',
]

function isMissing(value: unknown) {
  return value === null || value === undefined || value === ''
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)

  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export default function DataQualityPage() {
  const profile = useMemo(() => {
    const totalCells = records.length * fields.length
    const missingCells = records.reduce(
      (sum, record) =>
        sum + fields.filter(field => isMissing(record[field])).length,
      0,
    )

    const duplicateKeys = new Set<string>()
    const duplicateRows = new Set<number>()

    records.forEach((record, index) => {
      const key = JSON.stringify(record)
      if (duplicateKeys.has(key)) duplicateRows.add(index)
      duplicateKeys.add(key)
    })

    const invalidRows = records.filter(record => {
      const invalidNumber =
        [record.fertilizer_kg, record.seed_kg, record.water_liters,
          record.yield_tonnes_ha].some(
          value => value !== null && value !== undefined && value < 0,
        )

      const invalidDate =
        !isValidDate(record.sowing_date) ||
        (record.harvest_date !== '' &&
          !isValidDate(record.harvest_date)) ||
        (record.harvest_date !== '' &&
          isValidDate(record.sowing_date) &&
          isValidDate(record.harvest_date) &&
          record.harvest_date < record.sowing_date)

      return invalidNumber || invalidDate
    })

    const missingPercentage = (missingCells / totalCells) * 100
    const duplicatePercentage = (duplicateRows.size / records.length) * 100
    const invalidPercentage = (invalidRows.length / records.length) * 100

    const score = Math.max(
      0,
      Math.round(100 - missingPercentage - duplicatePercentage - invalidPercentage),
    )

    return {
      totalCells,
      missingCells,
      duplicateCount: duplicateRows.size,
      invalidCount: invalidRows.length,
      missingPercentage,
      score,
    }
  }, [])

  const cropCounts = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.crop] = (acc[record.crop] || 0) + 1
    return acc
  }, {})

  const qualityCards = [
    {
      label: 'Total Records',
      value: records.length,
      description: 'Agricultural records profiled',
      icon: Database,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Missing Values',
      value: profile.missingCells,
      description: 'Empty or unavailable cells',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Duplicate Records',
      value: profile.duplicateCount,
      description: 'Repeated complete records',
      icon: Copy,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Invalid Records',
      value: profile.invalidCount,
      description: 'Invalid values or date sequences',
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ]

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Data Quality & Profiling
        </h1>
        <p className="mt-1 text-gray-500">
          Inspect agricultural datasets for completeness, consistency,
          duplicates and invalid values.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          <Activity size={14} />
          Synthetic demonstration dataset
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {qualityCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <div className={`rounded-lg p-2 ${card.bg} ${card.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-gray-900">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-gray-500">{card.description}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-1">
          <h2 className="font-semibold text-gray-900">Overall Quality Score</h2>
          <div className="mt-6 flex items-center justify-center">
            <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-[12px] border-emerald-100">
              <span className="text-4xl font-bold text-emerald-700">
                {profile.score}%
              </span>
              <span className="text-xs text-gray-500">Quality score</span>
            </div>
          </div>
          <p className="mt-5 text-center text-sm text-gray-500">
            Indicative score based on missing values, duplicate rows and
            invalid records in this demonstration dataset.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <h2 className="font-semibold text-gray-900">Data Quality Checks</h2>
          <p className="mt-1 text-sm text-gray-500">
            Results from the current demonstration dataset.
          </p>

          <div className="mt-5 space-y-5">
            <div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Completeness</span>
                <span className="text-gray-500">
                  {profile.totalCells - profile.missingCells}/{profile.totalCells} cells
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${100 - profile.missingPercentage}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-600" size={20} />
                <div>
                  <p className="text-sm font-medium text-gray-800">Schema coverage</p>
                  <p className="text-xs text-gray-500">11 expected columns</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-emerald-700">Complete</span>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-amber-600" size={20} />
                <div>
                  <p className="text-sm font-medium text-gray-800">Missing values</p>
                  <p className="text-xs text-gray-500">Empty fields detected</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-amber-700">
                {profile.missingCells} found
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3">
                <Copy className="text-orange-600" size={20} />
                <div>
                  <p className="text-sm font-medium text-gray-800">Duplicate records</p>
                  <p className="text-xs text-gray-500">Exact repeated rows</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-orange-700">
                {profile.duplicateCount} found
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="text-red-600" size={20} />
                <div>
                  <p className="text-sm font-medium text-gray-800">Invalid records</p>
                  <p className="text-xs text-gray-500">Numeric and date checks</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-red-700">
                {profile.invalidCount} found
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-emerald-600" size={20} />
          <h2 className="font-semibold text-gray-900">Crop Distribution</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Number of records available for each crop.
        </p>

        <div className="mt-5 space-y-4">
          {Object.entries(cropCounts).map(([crop, count]) => (
            <div key={crop}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-700">{crop}</span>
                <span className="font-medium text-gray-900">{count} records</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{ width: `${(count / records.length) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="text-emerald-600" size={20} />
          <h2 className="font-semibold text-gray-900">Profiling Summary</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Initial findings requiring attention before analytical processing.
        </p>

        <div className="mt-5 space-y-3 text-sm">
          <div className="rounded-lg bg-amber-50 p-4 text-amber-900">
            <strong>Missing data:</strong> Soil type, fertilizer usage and
            harvest information contain unavailable values.
          </div>
          <div className="rounded-lg bg-orange-50 p-4 text-orange-900">
            <strong>Duplicates:</strong> An exact repeated agricultural record
            was detected.
          </div>
          <div className="rounded-lg bg-red-50 p-4 text-red-900">
            <strong>Invalid data:</strong> Negative fertilizer usage and an
            inconsistent sowing/harvest date sequence were detected.
          </div>
        </div>
      </div>
    </div>
  )
}
