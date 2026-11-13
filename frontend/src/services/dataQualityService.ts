
import { api } from './api'

export interface QualityBatch {
  batch_id: string
  source_file_name: string
  processing_status: string
  total_records: number
  valid_records: number
  complete_records: number
  incomplete_records: number
  duplicate_records: number
  records_with_missing_harvest: number
  records_with_missing_yield: number
  created_at: string | null
}

export interface QualitySummary {
  total_records: number
  valid_records: number
  incomplete_records: number
  duplicate_records: number
  missing_values: number
  missing_harvest_dates: number
  missing_harvest_weights: number
  missing_yields: number
  missing_crop_varieties: number
  missing_weather_conditions: number
  nullable_fields_checked: number
  nullable_cells_checked: number
  completeness_percentage: number
  quality_score: number
}

export interface CropDistribution {
  crop: string
  count: number
}

export interface QualityRecord {
  record_id: string
  batch_id: string
  farm_id: string
  plot_id: string
  crop: string
  crop_variety: string | null
  season: string
  soil_type: string
  weather_condition: string | null
  area_hectares: number
  area_source_unit: string
  sowing_date: string
  harvest_date: string | null
  harvest_weight_kg: number | null
  fertilizer_kg: number
  fertilizer_source_unit: string
  seed_kg: number
  seed_source_unit: string
  water_liters: number
  water_source_unit: string
  yield_tonnes_ha: number | null
  quality_status: 'VALID' | 'INCOMPLETE' | 'DUPLICATE' | string
  quality_issues: string[]
  source_file_name: string
}

export interface QualitySchemaField {
  name: string
  required: boolean
}

export interface DataQualityReport {
  batches: QualityBatch[]
  selected_batch_id: string | null
  summary: QualitySummary
  crop_distribution: CropDistribution[]
  records: QualityRecord[]
  records_returned: number
  records_truncated: boolean
  schema: QualitySchemaField[]
}

interface QualityApiEnvelope {
  success: boolean
  role: string
  data: DataQualityReport
}

export const dataQualityService = {
  getReport: async (batchId?: string): Promise<DataQualityReport> => {
    const response = await api.get<QualityApiEnvelope>(
      '/datasets/quality',
      {
        params: batchId ? { batchId } : {},
      }
    )

    const envelope = response.data

    if (
      !envelope ||
      envelope.success !== true ||
      !envelope.data
    ) {
      throw new Error('The quality service returned an invalid response.')
    }

    return envelope.data
  },
}
