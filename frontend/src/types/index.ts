
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


// CAP-16: Snowflake-backed anomaly assessments

export interface AnomalyBatch {
  batch_id: string
  source_file_name: string
  processing_status: string
  total_records: number
  created_at: string | null
}

export interface AnomalyAssessment {
  anomaly_id: string
  batch_id: string
  record_id: string
  farm_id: string
  plot_id: string
  crop: string
  season: string
  soil_type: string
  anomaly_type: string
  metric_name: string
  observed_value: number | null
  expected_value: number | null
  deviation_percentage: number | null
  severity: 'HIGH' | 'MEDIUM' | 'INFO'
  explanation: string
  detected_at: string | null
  source_file_name: string
}

export interface AnomalyBatchResponse {
  success: boolean
  role: string
  data: AnomalyBatch[]
}

export interface AnomalyAssessmentResponse {
  success: boolean
  role: string
  batch_id: string | null
  total_assessments: number
  data: AnomalyAssessment[]
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

// CAP-16: Snowflake-backed dashboard analytics

export interface DashboardDatasetAnalytics {
  total_datasets: number
  total_records: number
  valid_records: number
  complete_records: number
  incomplete_records: number
  duplicate_records: number
  missing_harvest_records: number
  missing_yield_records: number
  avg_fertilizer_kg_per_hectare: number | null
  avg_seed_kg_per_hectare: number | null
  avg_water_liters_per_hectare: number | null
}

export interface DashboardRecordAnalytics {
  total_agricultural_records: number
  valid_quality_records: number
  non_valid_quality_records: number
  avg_yield_tonnes_ha: number | null
  avg_fertilizer_kg_per_hectare: number | null
  avg_seed_kg_per_hectare: number | null
  avg_water_liters_per_hectare: number | null
}

export interface DashboardAnomalyDistribution {
  severity: string
  anomaly_type: string
  anomaly_count: number
}

export interface DashboardRecentDataset {
  batch_id: string
  source_file_name: string
  processing_status: string
  total_records: number
  valid_records: number
  incomplete_records: number
  duplicate_records: number
  created_at: string | null
}

export interface DashboardRecentAnomaly {
  anomaly_id: string
  batch_id: string
  farm_id: string
  plot_id: string
  crop: string
  season: string
  anomaly_type: string
  metric_name: string
  observed_value: number | null
  expected_value: number | null
  deviation_percentage: number | null
  severity: string
  explanation: string
  detected_at: string | null
}

export interface DashboardAnalytics {
  datasets: DashboardDatasetAnalytics
  records: DashboardRecordAnalytics
  anomaly_distribution: DashboardAnomalyDistribution[]
  recent_datasets: DashboardRecentDataset[]
  recent_anomalies: DashboardRecentAnomaly[]
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
