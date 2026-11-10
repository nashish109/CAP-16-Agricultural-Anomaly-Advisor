export type FieldStatus = 'HEALTHY' | 'MODERATE' | 'ATTENTION'
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS'
export type IrrigationStatus = 'PENDING' | 'RUNNING' | 'COMPLETED'

export interface User {
  id: number
  email: string
  fullName: string
  phone?: string
  location?: string
  role: string
}

export interface AuthResponse {
  token: string
  type: string
  user: User
}

export interface Farm {
  id: number
  name: string
  location: string
  areaAcres: number
  latitude?: number
  longitude?: number
  description?: string
  fieldCount?: number
  cropCount?: number
}

export interface Field {
  id: number
  name: string
  areaAcres: number
  cropType: string
  status: FieldStatus
  latitude?: number
  longitude?: number
  farmId: number
  farmName?: string
}

export interface Crop {
  id: number
  name: string
  variety?: string
  plantingDate: string
  expectedHarvestDate?: string
  growthStage: string
  healthStatus: FieldStatus
  areaAcres: number
  fieldId: number
  fieldName?: string
}

export interface SensorReading {
  id: number
  sensorId: number
  sensorType: string
  value: number
  unit: string
  recordedAt: string
}

export interface WeatherDay {
  date: string
  dayLabel: string
  temperature: number
  temperatureHigh?: number
  temperatureLow?: number
  humidity: number
  windSpeed: number
  rainfall: number
  condition: string
  rainProbability?: number
}

export interface WeatherResponse {
  location: string
  current: WeatherDay
  forecast: WeatherDay[]
  recommendations?: string[]
  alerts?: string[]
}

export interface MarketPrice {
  id: number
  cropName: string
  pricePerKg: number
  currency: string
  changePercent: number
  market: string
  recordedAt: string
}

export interface Alert {
  id: number
  title: string
  description: string
  severity: AlertSeverity
  type: string
  read: boolean
  timestamp: string
}

export interface DashboardStats {
  totalFarms: number
  farmsChangePercent: number
  totalFields: number
  fieldsChangePercent: number
  totalCrops: number
  cropsChangePercent: number
  soilMoisture: number
  moistureChangePercent: number
  pendingTasks: number
  totalArea: number
  activeSensors: number
}

export interface DiseaseDetectionResult {
  crop: string
  disease: string
  confidence: number
  description: string
  treatment: string[]
  prevention: string[]
  recommendations: string[]
}

export interface YieldPredictionResult {
  predictedYield: number
  unit: string
  confidence: number
  changeVsLastSeason: number
  historical: { season: string; yield: number }[]
  factors: { name: string; impact: string }[]
}

export interface IrrigationRecommendation {
  fieldId: number
  fieldName: string
  soilMoisture: number
  soilTemperature: number
  humidity: number
  rainfall: number
  ph: number
  waterRequirement: string
  status: string
  recommendation: string
  recommendedMinutes: number
}

export interface ApiError {
  message: string
  status?: number
}
