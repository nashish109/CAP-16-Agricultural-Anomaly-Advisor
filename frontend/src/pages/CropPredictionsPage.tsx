import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Badge,
  Button,
  Card,
  Input,
  PageHeader,
  Select,
  Skeleton,
} from '../components/ui'
import { useToast } from '../context/ToastContext'
import { fieldService, yieldService } from '../services'
import type { Field, YieldPredictionResult } from '../types'

const demoFields: Field[] = [
  { id: 1, name: 'North Paddy Block', cropType: 'Paddy', status: 'HEALTHY', areaAcres: 45, farmId: 1 },
  { id: 2, name: 'Maize Ridge', cropType: 'Maize', status: 'MODERATE', areaAcres: 38, farmId: 1 },
  { id: 3, name: 'Chili Terrace', cropType: 'Chili', status: 'ATTENTION', areaAcres: 22, farmId: 2 },
]

const demoResult: YieldPredictionResult = {
  predictedYield: 4.25,
  unit: 'ton/ha',
  confidence: 82,
  changeVsLastSeason: 6.8,
  historical: [
    { season: '2022 Yala', yield: 3.4 },
    { season: '2023 Maha', yield: 3.7 },
    { season: '2024 Yala', yield: 3.9 },
    { season: '2025 Maha', yield: 4.0 },
    { season: '2026 Pred.', yield: 4.25 },
  ],
  factors: [
    { name: 'Soil moisture', impact: 'Positive — within optimal band' },
    { name: 'Seasonal rainfall', impact: 'Neutral — slight deficit expected' },
    { name: 'Temperature range', impact: 'Positive — favorable for grain fill' },
    { name: 'Soil pH', impact: 'Slightly acidic — monitor nutrient uptake' },
  ],
}

export default function CropPredictionsPage() {
  const { toast } = useToast()
  const [fields, setFields] = useState<Field[]>(demoFields)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<YieldPredictionResult | null>(null)
  const [form, setForm] = useState({
    crop: 'Paddy',
    fieldId: '1',
    season: 'Maha 2026',
    areaAcres: '45',
    soilPh: '6.5',
    soilMoisture: '42',
    avgTemperature: '29',
    rainfall: '180',
  })

  useEffect(() => {
    fieldService
      .getAll()
      .then((data) => {
        if (data.length) {
          setFields(data)
          setForm((f) => ({
            ...f,
            fieldId: String(data[0].id),
            crop: data[0].cropType || f.crop,
            areaAcres: String(data[0].areaAcres),
          }))
        }
      })
      .catch(() => undefined)
  }, [])

  const predict = async () => {
    setLoading(true)
    try {
      const data = await yieldService.predict({
        crop: form.crop,
        fieldId: Number(form.fieldId),
        season: form.season,
        areaAcres: Number(form.areaAcres),
        soilPh: Number(form.soilPh) || undefined,
        soilMoisture: Number(form.soilMoisture) || undefined,
        avgTemperature: Number(form.avgTemperature) || undefined,
        rainfall: Number(form.rainfall) || undefined,
      })
      setResult(data)
      toast('Yield prediction ready', 'success')
    } catch {
      setResult(demoResult)
      toast('Showing demo prediction — API unavailable', 'warning')
    } finally {
      setLoading(false)
    }
  }

  const chartData =
    result?.historical.map((h) => ({ season: h.season, yield: h.yield })) ||
    demoResult.historical.map((h) => ({ season: h.season, yield: h.yield }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crop Predictions"
        subtitle="Estimate seasonal yield from field and climate inputs"
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="Prediction Inputs" className="lg:col-span-2">
          <div className="space-y-3">
            <Input
              label="Crop"
              value={form.crop}
              onChange={(e) => setForm((f) => ({ ...f, crop: e.target.value }))}
            />
            <Select
              label="Field"
              value={form.fieldId}
              onChange={(e) => {
                const field = fields.find((x) => x.id === Number(e.target.value))
                setForm((f) => ({
                  ...f,
                  fieldId: e.target.value,
                  crop: field?.cropType || f.crop,
                  areaAcres: field ? String(field.areaAcres) : f.areaAcres,
                }))
              }}
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
            <Input
              label="Season"
              value={form.season}
              onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))}
            />
            <Input
              label="Area (acres)"
              type="number"
              value={form.areaAcres}
              onChange={(e) => setForm((f) => ({ ...f, areaAcres: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Soil pH"
                type="number"
                step="0.1"
                value={form.soilPh}
                onChange={(e) => setForm((f) => ({ ...f, soilPh: e.target.value }))}
              />
              <Input
                label="Soil Moisture %"
                type="number"
                value={form.soilMoisture}
                onChange={(e) => setForm((f) => ({ ...f, soilMoisture: e.target.value }))}
              />
              <Input
                label="Avg Temp °C"
                type="number"
                value={form.avgTemperature}
                onChange={(e) => setForm((f) => ({ ...f, avgTemperature: e.target.value }))}
              />
              <Input
                label="Rainfall mm"
                type="number"
                value={form.rainfall}
                onChange={(e) => setForm((f) => ({ ...f, rainfall: e.target.value }))}
              />
            </div>
            <Button className="w-full" loading={loading} onClick={predict}>
              Predict Yield
            </Button>
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-3">
          {loading ? (
            <>
              <Skeleton className="h-36" />
              <Skeleton className="h-64" />
            </>
          ) : !result ? (
            <Card>
              <p className="py-16 text-center text-sm text-gray-500">
                Submit the form to generate a yield forecast.
              </p>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <p className="text-xs text-gray-500">Predicted Yield</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {result.predictedYield}{' '}
                    <span className="text-sm font-medium text-gray-500">{result.unit}</span>
                  </p>
                </Card>
                <Card>
                  <p className="text-xs text-gray-500">vs Last Season</p>
                  <p
                    className={`mt-2 text-3xl font-semibold ${
                      result.changeVsLastSeason >= 0 ? 'text-brand-700' : 'text-red-600'
                    }`}
                  >
                    {result.changeVsLastSeason >= 0 ? '+' : ''}
                    {result.changeVsLastSeason}%
                  </p>
                </Card>
                <Card>
                  <p className="text-xs text-gray-500">Confidence</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{result.confidence}%</p>
                  <Badge tone="success">Model confidence</Badge>
                </Card>
              </div>

              <Card title="Historical + Predicted Yield">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="season" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" unit=" t" />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="yield"
                        name="Yield (ton/ha)"
                        stroke="#15803d"
                        strokeWidth={2.5}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Key Factors">
                <ul className="space-y-2">
                  {result.factors.map((f) => (
                    <li
                      key={f.name}
                      className="flex flex-col gap-0.5 rounded-xl bg-gray-50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-sm font-medium text-gray-900">{f.name}</span>
                      <span className="text-sm text-gray-600">{f.impact}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
