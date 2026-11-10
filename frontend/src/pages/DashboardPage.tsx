
import {
  Sprout,
  MapPinned,
  Database,
  TriangleAlert,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  Activity,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts'

const kpis = [
  { title: 'Total Farms', value: '8', subtitle: 'Registered farms', icon: MapPinned, color: 'emerald', change: '+2 this month' },
  { title: 'Plots Analyzed', value: '24', subtitle: 'Across crop cycles', icon: Sprout, color: 'lime', change: '+6 this month' },
  { title: 'Datasets Processed', value: '12', subtitle: 'Successfully processed', icon: Database, color: 'sky', change: '+4 this month' },
  { title: 'Anomalies Detected', value: '4', subtitle: 'Require investigation', icon: TriangleAlert, color: 'amber', change: '2 high severity' },
]

const inputData = [
  { crop: 'Paddy', fertilizer: 85, seeds: 42, water: 120 },
  { crop: 'Maize', fertilizer: 65, seeds: 35, water: 90 },
  { crop: 'Wheat', fertilizer: 72, seeds: 38, water: 80 },
  { crop: 'Tomato', fertilizer: 95, seeds: 28, water: 110 },
  { crop: 'Chili', fertilizer: 60, seeds: 22, water: 75 },
]

const yieldData = [
  { cycle: 'Cycle 1', expected: 4.5, actual: 4.2 },
  { cycle: 'Cycle 2', expected: 5.0, actual: 4.8 },
  { cycle: 'Cycle 3', expected: 4.8, actual: 3.5 },
  { cycle: 'Cycle 4', expected: 5.2, actual: 5.0 },
  { cycle: 'Cycle 5', expected: 4.6, actual: 3.9 },
]

const anomalyData = [
  { name: 'High', value: 2, color: '#ef4444' },
  { name: 'Medium', value: 1, color: '#f59e0b' },
  { name: 'Low', value: 1, color: '#eab308' },
]

const qualityData = [
  { label: 'Valid records', value: 92, color: 'bg-emerald-500' },
  { label: 'Missing values', value: 5, color: 'bg-amber-500' },
  { label: 'Invalid records', value: 3, color: 'bg-red-500' },
]

const activities = [
  { name: 'Paddy – Farm Dataset', status: 'Processed', date: '10 Nov 2026', records: 120 },
  { name: 'Maize – Plot Comparison', status: 'Processed', date: '10 Nov 2026', records: 85 },
  { name: 'Tomato – Yield Records', status: 'Under Review', date: '09 Nov 2026', records: 64 },
  { name: 'Wheat – Input Dataset', status: 'Processed', date: '08 Nov 2026', records: 96 },
]

function KpiCard({ item }: { item: typeof kpis[number] }) {
  const Icon = item.icon

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{item.title}</p>
        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
          <Icon size={21} />
        </div>
      </div>
      <h2 className="mt-3 text-3xl font-bold text-gray-900">{item.value}</h2>
      <p className="mt-1 text-sm text-gray-500">{item.subtitle}</p>
      <p className="mt-3 text-xs font-medium text-emerald-700">{item.change}</p>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Agricultural Intelligence Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor agricultural inputs, compare crop performance and investigate yield anomalies.
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          Synthetic demonstration data
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <KpiCard key={item.title} item={item} />
        ))}
      </div>

      {/* Input Analysis */}
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Agricultural Input Consumption</h3>
          <p className="mb-5 mt-1 text-sm text-gray-500">
            Input usage comparison across crop types (illustrative units)
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inputData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="crop" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="fertilizer" name="Fertilizer" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="seeds" name="Seeds" fill="#84cc16" radius={[4, 4, 0, 0]} />
                <Bar dataKey="water" name="Water" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Yield Performance */}
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Expected vs Actual Yield</h3>
          <p className="mb-5 mt-1 text-sm text-gray-500">
            Yield comparison across sample crop cycles (tonnes/hectare)
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yieldData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="cycle" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="expected" name="Expected Yield" stroke="#0ea5e9" strokeWidth={3} />
                <Line type="monotone" dataKey="actual" name="Actual Yield" stroke="#16a34a" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Anomaly and Data Quality */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Yield Anomaly Overview</h3>
          <p className="mt-1 text-sm text-gray-500">Distribution by severity</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="h-64 w-full max-w-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={anomalyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                    {anomalyData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {anomalyData.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <strong className="text-sm text-gray-900">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Data Quality Summary</h3>
          <p className="mb-6 mt-1 text-sm text-gray-500">Sample dataset validation results</p>
          {qualityData.map((item) => (
            <div key={item.label} className="mb-6">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-600">{item.label}</span>
                <strong className="text-gray-900">{item.value}%</strong>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
          <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="mr-2 inline" size={17} />
            Sample data quality profile generated.
          </div>
        </section>
      </div>

      {/* Recent Anomalies */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Recent Anomaly Indicators</h3>
            <p className="mt-1 text-sm text-gray-500">Illustrative cases requiring investigation</p>
          </div>
          <TriangleAlert className="text-amber-600" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { plot: 'Plot P-103', crop: 'Paddy', issue: 'Input usage unusually high', severity: 'High', color: 'red' },
            { plot: 'Plot P-108', crop: 'Tomato', issue: 'Yield below expected range', severity: 'Medium', color: 'amber' },
            { plot: 'Plot P-114', crop: 'Maize', issue: 'Fertilizer and yield mismatch', severity: 'Low', color: 'yellow' },
          ].map((item) => (
            <div key={item.plot} className="rounded-lg border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <strong className="text-sm text-gray-900">{item.plot}</strong>
                <span className={`rounded-full bg-${item.color}-50 px-2 py-1 text-xs font-semibold text-${item.color}-700`}>
                  {item.severity}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{item.crop}</p>
              <p className="mt-2 text-sm text-gray-500">{item.issue}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Recent Dataset Activity</h3>
            <p className="mt-1 text-sm text-gray-500">Latest ingestion and processing records</p>
          </div>
          <Activity className="text-emerald-700" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-gray-500">
              <tr>
                <th className="py-3">Dataset</th>
                <th className="py-3">Records</th>
                <th className="py-3">Date</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((item) => (
                <tr key={item.name} className="border-b last:border-0">
                  <td className="py-4 font-medium text-gray-800">
                    <FileSpreadsheet className="mr-2 inline text-emerald-700" size={17} />
                    {item.name}
                  </td>
                  <td className="py-4 text-gray-600">{item.records}</td>
                  <td className="py-4 text-gray-600">{item.date}</td>
                  <td className="py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      item.status === 'Processed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center gap-2 rounded-lg bg-sky-50 p-3 text-xs text-sky-800">
        <Clock3 size={16} />
        All displayed metrics and records are synthetic demonstration data, not live agricultural measurements.
        <TrendingUp className="ml-auto" size={16} />
        <TrendingDown size={16} />
      </div>
    </div>
  )
}
