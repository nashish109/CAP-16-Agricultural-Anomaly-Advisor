import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { FileBarChart } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  PageHeader,
  Select,
} from '../components/ui'
import { useToast } from '../context/ToastContext'

type ReportType = 'farm' | 'crop' | 'irrigation' | 'yield' | 'disease'

const reportOptions: { value: ReportType; label: string }[] = [
  { value: 'farm', label: 'Farm Performance' },
  { value: 'crop', label: 'Crop Health' },
  { value: 'irrigation', label: 'Irrigation Usage' },
  { value: 'yield', label: 'Yield Summary' },
  { value: 'disease', label: 'Disease Incidents' },
]

const reportData: Record<
  ReportType,
  {
    title: string
    stats: { label: string; value: string }[]
    chart: { name: string; value: number }[]
    chartType: 'bar' | 'line'
    summary: string
  }
> = {
  farm: {
    title: 'Farm Performance Overview',
    stats: [
      { label: 'Total Area', value: '312.5 ac' },
      { label: 'Active Fields', value: '7' },
      { label: 'Utilization', value: '91%' },
      { label: 'Avg Moisture', value: '42%' },
    ],
    chart: [
      { name: 'Jan', value: 72 },
      { name: 'Feb', value: 78 },
      { name: 'Mar', value: 81 },
      { name: 'Apr', value: 76 },
      { name: 'May', value: 84 },
      { name: 'Jun', value: 88 },
    ],
    chartType: 'line',
    summary:
      'Overall farm utilization is strong this quarter with stable moisture levels across Northern Green Farm and Coastal Valley Estate.',
  },
  crop: {
    title: 'Crop Health Report',
    stats: [
      { label: 'Healthy', value: '8' },
      { label: 'Moderate', value: '3' },
      { label: 'Attention', value: '1' },
      { label: 'Avg Stage', value: 'Vegetative' },
    ],
    chart: [
      { name: 'Paddy', value: 92 },
      { name: 'Maize', value: 78 },
      { name: 'Chili', value: 64 },
      { name: 'Tomato', value: 88 },
      { name: 'Onion', value: 85 },
    ],
    chartType: 'bar',
    summary:
      'Most crops are within healthy ranges. Chili Terrace needs closer scouting due to humidity-driven disease pressure.',
  },
  irrigation: {
    title: 'Irrigation Usage',
    stats: [
      { label: 'Cycles', value: '24' },
      { label: 'Water Used', value: '186 m³' },
      { label: 'Avg Duration', value: '42 min' },
      { label: 'Efficiency', value: '+12%' },
    ],
    chart: [
      { name: 'Mon', value: 28 },
      { name: 'Tue', value: 35 },
      { name: 'Wed', value: 22 },
      { name: 'Thu', value: 40 },
      { name: 'Fri', value: 18 },
      { name: 'Sat', value: 30 },
      { name: 'Sun', value: 13 },
    ],
    chartType: 'bar',
    summary:
      'Smart scheduling reduced mid-day irrigation. Efficiency improved 12% versus last month.',
  },
  yield: {
    title: 'Yield Summary',
    stats: [
      { label: 'Predicted', value: '4.25 t/ha' },
      { label: 'Last Season', value: '4.0 t/ha' },
      { label: 'Change', value: '+6.8%' },
      { label: 'Confidence', value: '82%' },
    ],
    chart: [
      { name: '2022', value: 3.4 },
      { name: '2023', value: 3.7 },
      { name: '2024', value: 3.9 },
      { name: '2025', value: 4.0 },
      { name: '2026', value: 4.25 },
    ],
    chartType: 'line',
    summary:
      'Yield trajectory remains upward. Favorable temperatures and steady soil moisture support the projected gain.',
  },
  disease: {
    title: 'Disease Incidents',
    stats: [
      { label: 'Scans', value: '18' },
      { label: 'Positive', value: '4' },
      { label: 'Treated', value: '3' },
      { label: 'Risk Score', value: 'Medium' },
    ],
    chart: [
      { name: 'Wk1', value: 1 },
      { name: 'Wk2', value: 0 },
      { name: 'Wk3', value: 2 },
      { name: 'Wk4', value: 1 },
      { name: 'Wk5', value: 0 },
      { name: 'Wk6', value: 0 },
    ],
    chartType: 'bar',
    summary:
      'Incident rate declining after targeted fungicide application on tomato and chili blocks.',
  },
}

export default function ReportsPage() {
  const { toast } = useToast()
  const [type, setType] = useState<ReportType>('farm')
  const [generated, setGenerated] = useState(false)
  const [generating, setGenerating] = useState(false)

  const report = useMemo(() => reportData[type], [type])

  const generate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerated(true)
      setGenerating(false)
      toast(`${reportOptions.find((o) => o.value === type)?.label} report generated`, 'success')
    }, 700)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generate performance summaries for farms, crops, and operations"
        actions={
          <div className="flex flex-wrap gap-2">
            <Select
              value={type}
              onChange={(e) => {
                setType(e.target.value as ReportType)
                setGenerated(false)
              }}
              className="min-w-[200px]"
            >
              {reportOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Button loading={generating} onClick={generate}>
              <FileBarChart className="h-4 w-4" />
              Generate
            </Button>
          </div>
        }
      />

      <Card
        title={generated ? report.title : 'Report Preview'}
        action={generated ? <Badge tone="success">Ready</Badge> : <Badge tone="neutral">Draft</Badge>}
      >
        {!generated ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <FileBarChart className="h-6 w-6" />
            </div>
            <p className="font-medium text-gray-900">Select a report type and click Generate</p>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              Preview will include summary KPIs and a trend chart for the selected category.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-gray-600">{report.summary}</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {report.stats.map((s) => (
                <div key={s.label} className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {report.chartType === 'bar' ? (
                  <BarChart data={report.chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                    <Bar dataKey="value" fill="#16a34a" radius={[8, 8, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={report.chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                    <Line type="monotone" dataKey="value" stroke="#15803d" strokeWidth={2.5} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
