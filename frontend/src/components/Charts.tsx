import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card } from './ui'

const monthData = [
  { name: 'Jan', moisture: 48, temp: 26, ph: 6.2, ec: 1.1 },
  { name: 'Feb', moisture: 45, temp: 27, ph: 6.3, ec: 1.2 },
  { name: 'Mar', moisture: 52, temp: 28, ph: 6.4, ec: 1.2 },
  { name: 'Apr', moisture: 40, temp: 29, ph: 6.3, ec: 1.3 },
  { name: 'May', moisture: 38, temp: 30, ph: 6.5, ec: 1.2 },
  { name: 'Jun', moisture: 42, temp: 29, ph: 6.4, ec: 1.2 },
  { name: 'Jul', moisture: 43, temp: 28.5, ph: 6.4, ec: 1.2 },
  { name: 'Aug', moisture: 44, temp: 28, ph: 6.4, ec: 1.2 },
]

export function SoilTrendChart({ data = monthData }: { data?: typeof monthData }) {
  const latest = data[data.length - 1]
  return (
    <Card title="Soil & Environment Trends">
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Moisture', value: `${latest.moisture}%`, color: 'text-brand-700 bg-brand-50' },
          { label: 'Temp', value: `${latest.temp}°C`, color: 'text-sky-700 bg-sky-50' },
          { label: 'pH Level', value: String(latest.ph), color: 'text-violet-700 bg-violet-50' },
          { label: 'EC', value: `${latest.ec} dS/m`, color: 'text-amber-700 bg-amber-50' },
        ].map((m) => (
          <div key={m.label} className={`rounded-lg px-2.5 py-2 ${m.color}`}>
            <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">{m.label}</p>
            <p className="text-sm font-semibold">{m.value}</p>
          </div>
        ))}
      </div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="moisture" name="Soil Moisture (%)" stroke="#16a34a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="temp" name="Soil Temp (°C)" stroke="#0ea5e9" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

const yieldData = [
  { month: 'Jan', yield: 3.2 },
  { month: 'Feb', yield: 3.4 },
  { month: 'Mar', yield: 3.5 },
  { month: 'Apr', yield: 3.6 },
  { month: 'May', yield: 3.8 },
  { month: 'Jun', yield: 3.9 },
  { month: 'Jul', yield: 4.0 },
  { month: 'Aug', yield: 4.1 },
]

export function YieldTrendChart({ data = yieldData }: { data?: typeof yieldData }) {
  return (
    <Card
      title="Crop Yield Trend (ton/ha)"
      action={
        <select className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600">
          <option>This Year</option>
          <option>Last Year</option>
        </select>
      }
    >
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" domain={[3, 4.5]} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="yield" name="Paddy" stroke="#15803d" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

const marketData = [
  { month: 'Jan', paddy: 115, tomato: 170 },
  { month: 'Feb', paddy: 117, tomato: 175 },
  { month: 'Mar', paddy: 118, tomato: 172 },
  { month: 'Apr', paddy: 119, tomato: 178 },
  { month: 'May', paddy: 120, tomato: 176 },
  { month: 'Jun', paddy: 118, tomato: 180 },
  { month: 'Jul', paddy: 120, tomato: 182 },
  { month: 'Aug', paddy: 120, tomato: 180 },
]

export function MarketTrendChart({ data = marketData }: { data?: typeof marketData }) {
  return (
    <Card
      title="Market Price Trend (LKR/kg)"
      action={
        <select className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600">
          <option>This Year</option>
          <option>Last Year</option>
        </select>
      }
    >
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="paddy" name="Paddy" stroke="#16a34a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="tomato" name="Tomato" stroke="#ea580c" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
