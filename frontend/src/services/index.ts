import { api } from './api'
import type {
  AuthResponse,
  Farm,
  Field,
  Crop,
  SensorReading,
  WeatherResponse,
  WeatherDay,
  MarketPrice,
  Alert,
  DashboardStats,
  DashboardAnalytics,
  AnomalyBatch,
  AnomalyAssessment,
  AnomalyRecommendation,
  ComparablePlotRow,
  DiseaseDetectionResult,
  YieldPredictionResult,
  IrrigationRecommendation,
  User,
} from '../types'

function dayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Today'
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' })
  } catch {
    return `Day ${index + 1}`
  }
}

function mapWeather(raw: Record<string, unknown>): WeatherResponse {
  const forecastRaw = (raw.forecast as Record<string, unknown>[]) || []

  const mapDay = (d: Record<string, unknown>, i: number): WeatherDay => ({
    date: String(d.forecastDate || d.date || ''),
    dayLabel: String(d.dayLabel || dayLabel(String(d.forecastDate || d.date || ''), i)),
    temperature: Number(d.temperature ?? 27),
    temperatureHigh: d.temperatureHigh != null ? Number(d.temperatureHigh) : undefined,
    temperatureLow: d.temperatureLow != null ? Number(d.temperatureLow) : undefined,
    humidity: Number(d.humidity ?? 65),
    windSpeed: Number(d.windSpeed ?? 10),
    rainfall: Number(d.rainfall ?? 0),
    condition: String(d.condition || 'Partly Cloudy'),
    rainProbability: d.rainProbability != null ? Number(d.rainProbability) : undefined,
  })

  const forecast = forecastRaw.map(mapDay)
  const current = raw.current
    ? mapDay(raw.current as Record<string, unknown>, 0)
    : forecast[0] || mapDay(raw, 0)

  return {
    location: String(raw.location || 'Jaffna, Sri Lanka'),
    current,
    forecast: forecast.length ? forecast : [current],
    recommendations: (raw.recommendations as string[]) || undefined,
    alerts: (raw.alerts as string[]) || undefined,
  }
}

function mapAuth(raw: Record<string, unknown>): AuthResponse {
  if (raw.user) {
    return {
      token: String(raw.token),
      type: String(raw.type || 'Bearer'),
      user: raw.user as User,
    }
  }

  return {
    token: String(raw.token),
    type: 'Bearer',
    user: {
      id: Number(raw.userId || 0),
      email: String(raw.email || ''),
      fullName: String(raw.fullName || ''),
      role: String(raw.role || 'USER'),
      phone: raw.phone ? String(raw.phone) : undefined,
      location: raw.location ? String(raw.location) : undefined,
    },
  }
}

function mapDashboard(raw: Record<string, unknown>): DashboardStats {
  return {
    totalFarms: Number(raw.totalFarms ?? 3),
    farmsChangePercent: Number(raw.farmsChangePercent ?? 20),
    totalFields: Number(raw.totalFields ?? 7),
    fieldsChangePercent: Number(raw.fieldsChangePercent ?? 16),
    totalCrops: Number(raw.totalCrops ?? 12),
    cropsChangePercent: Number(raw.cropsChangePercent ?? 12),
    soilMoisture: Number(raw.soilMoisture ?? 42),
    moistureChangePercent: Number(raw.moistureChangePercent ?? -5),
    pendingTasks: Number(raw.pendingTasks ?? raw.unreadAlerts ?? 4),
    totalArea: Number(raw.totalArea ?? raw.totalAreaAcres ?? 312.5),
    activeSensors: Number(raw.activeSensors ?? 5),
  }
}

function mapDisease(raw: Record<string, unknown>): DiseaseDetectionResult {
  const recs = (raw.recommendations as string[]) || []
  const confidenceRaw = Number(raw.confidence ?? 0.9)

  return {
    crop: String(raw.crop || raw.cropName || 'Tomato'),
    disease: String(raw.disease || 'Unknown'),
    confidence: confidenceRaw <= 1 ? confidenceRaw * 100 : confidenceRaw,
    description: String(
      raw.description ||
        `${raw.disease || 'Disease'} detected on ${raw.crop || raw.cropName || 'crop'}. Early intervention is recommended.`
    ),
    treatment: (raw.treatment as string[]) || recs.slice(0, 2),
    prevention: (raw.prevention as string[]) || recs.slice(2),
    recommendations: recs,
  }
}

function mapYield(raw: Record<string, unknown>): YieldPredictionResult {
  const factorsRaw = raw.factors
  let factors: { name: string; impact: string }[] = []

  if (Array.isArray(factorsRaw)) {
    factors = factorsRaw.map((f) =>
      typeof f === 'string'
        ? { name: f, impact: 'Influential' }
        : {
            name: String((f as { name?: string }).name || f),
            impact: String((f as { impact?: string }).impact || 'Influential'),
          }
    )
  }

  const confidenceRaw = Number(raw.confidence ?? 0.85)
  const predicted = Number(raw.predictedYield ?? 4.2)

  const historical =
    (raw.historical as { season: string; yield: number }[]) ||
    [
      { season: '2022', yield: 3.4 },
      { season: '2023', yield: 3.7 },
      { season: '2024', yield: 3.9 },
      { season: '2025', yield: 4.1 },
      { season: 'Pred.', yield: predicted },
    ]

  return {
    predictedYield: predicted,
    unit: String(raw.unit || 'ton/ha'),
    confidence: confidenceRaw <= 1 ? confidenceRaw * 100 : confidenceRaw,
    changeVsLastSeason: Number(raw.changeVsLastSeason ?? 12),
    historical,
    factors,
  }
}

function mapIrrigation(raw: Record<string, unknown>): IrrigationRecommendation {
  return {
    fieldId: Number(raw.fieldId),
    fieldName: String(raw.fieldName || 'Field'),
    soilMoisture: Number(raw.soilMoisture ?? 42),
    soilTemperature: Number(raw.soilTemperature ?? 26),
    humidity: Number(raw.humidity ?? 65),
    rainfall: Number(raw.rainfall ?? 0),
    ph: Number(raw.ph ?? 6.5),
    waterRequirement: String(raw.waterRequirement || `${raw.recommendedWaterAmount ?? 1800} L`),
    status: String(raw.status || raw.urgency || 'Moderate'),
    recommendation: String(raw.recommendation || 'Monitor soil moisture.'),
    recommendedMinutes: Number(raw.recommendedMinutes ?? raw.recommendedDurationMinutes ?? 45),
  }
}

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    return mapAuth(data as Record<string, unknown>)
  },

  register: async (payload: {
    fullName: string
    email: string
    phone: string
    password: string
    location: string
  }) => {
    const { data } = await api.post('/auth/register', payload)
    return mapAuth(data as Record<string, unknown>)
  },
}

export const dashboardService = {
  getStats: async () => {
    const { data } = await api.get('/dashboard/stats')
    return mapDashboard(data as Record<string, unknown>)
  },

  // CAP-16: Retrieve Snowflake-backed agricultural analytics.
  getAnalytics: async (): Promise<DashboardAnalytics> => {
    const { data } = await api.get<DashboardAnalytics>('/dashboard/analytics')
    return data
  },
}

export const farmService = {
  getAll: () => api.get<Farm[]>('/farms').then((r) => r.data),
  getById: (id: number) => api.get<Farm>(`/farms/${id}`).then((r) => r.data),
  create: (data: Partial<Farm>) => api.post<Farm>('/farms', data).then((r) => r.data),
  update: (id: number, data: Partial<Farm>) => api.put<Farm>(`/farms/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/farms/${id}`),
}

export const fieldService = {
  getAll: (farmId?: number) =>
    api.get<Field[]>('/fields', { params: farmId ? { farmId } : {} }).then((r) => r.data),
  getById: (id: number) => api.get<Field>(`/fields/${id}`).then((r) => r.data),
  create: (data: Partial<Field>) => api.post<Field>('/fields', data).then((r) => r.data),
  update: (id: number, data: Partial<Field>) => api.put<Field>(`/fields/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/fields/${id}`),
}

export const cropService = {
  getAll: () => api.get<Crop[]>('/crops').then((r) => r.data),
  getById: (id: number) => api.get<Crop>(`/crops/${id}`).then((r) => r.data),
  create: (data: Partial<Crop>) => api.post<Crop>('/crops', data).then((r) => r.data),
  update: (id: number, data: Partial<Crop>) => api.put<Crop>(`/crops/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/crops/${id}`),
}

export const sensorService = {
  getReadings: (fieldId: number) =>
    api.get<SensorReading[]>(`/sensors/${fieldId}/readings`).then((r) => r.data),

  getLatest: async (fieldId: number) => {
    const readings = await api.get<SensorReading[]>(`/sensors/${fieldId}/readings`).then((r) => r.data)
    const latest: Record<string, number> = {}

    readings.forEach((reading) => {
      const key = reading.sensorType
      if (!(key in latest)) latest[key] = reading.value
    })

    return latest
  },
}

export const weatherService = {
  get: async (location?: string) => {
    const { data } = await api.get('/weather', { params: location ? { location } : {} })
    return mapWeather(data as Record<string, unknown>)
  },
}

export const marketService = {
  getPrices: () => api.get<MarketPrice[]>('/market-prices').then((r) => r.data),
}

// Existing PostgreSQL operational notifications.
export const alertService = {
  getAll: () => api.get<Alert[]>('/alerts').then((r) => r.data),
}

// CAP-16: Snowflake-backed agricultural anomaly assessments and recommendations.
export const anomalyService = {
  getBatches: async (): Promise<AnomalyBatch[]> => {
    const { data } = await api.get('/anomalies/batches')
    return data.data
  },

  getAssessments: async (
    batchId?: string
  ): Promise<AnomalyAssessment[]> => {
    const { data } = await api.get('/anomalies/assessments', {
      params: batchId ? { batchId } : {},
    })

    return data.data
  },

  getRecommendations: async (
    batchId?: string
  ): Promise<AnomalyRecommendation[]> => {
    const { data } = await api.get('/anomalies/recommendations', {
      params: batchId ? { batchId } : {},
    })

    return data.data
  },

  getComparablePlots: async (batchId: string): Promise<ComparablePlotRow[]> => {
    const { data } = await api.get('/anomalies/comparable-plots', {
      params: { batchId },
    })

    return data.data
  },
}

export const diseaseService = {
  detect: async (file: File, fieldId?: number) => {
    const form = new FormData()
    form.append('image', file)
    if (fieldId) form.append('fieldId', String(fieldId))

    // Do not set Content-Type — browser must add multipart boundary.
    const { data } = await api.post('/disease-detection', form)
    return mapDisease(data as Record<string, unknown>)
  },
}

export const yieldService = {
  predict: async (payload: {
    crop: string
    fieldId: number
    season: string
    areaAcres: number
    soilPh?: number
    soilMoisture?: number
    avgTemperature?: number
    rainfall?: number
  }) => {
    const { data } = await api.post('/yield-prediction', {
      cropName: payload.crop,
      fieldId: payload.fieldId,
      season: payload.season,
      areaAcres: payload.areaAcres,
      temperature: payload.avgTemperature,
      rainfall: payload.rainfall,
      soilType: payload.soilPh != null ? `pH ${payload.soilPh}` : undefined,
    })

    return mapYield(data as Record<string, unknown>)
  },
}

export const irrigationService = {
  getRecommendation: async (fieldId: number) => {
    const { data } = await api.get('/irrigation/recommendation', { params: { fieldId } })
    return mapIrrigation(data as Record<string, unknown>)
  },

  start: (fieldId: number, durationMinutes: number) =>
    api.post('/irrigation/start', { fieldId, durationMinutes }).then((r) => r.data),
}

export type { AuthResponse }
