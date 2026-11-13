
import { useState } from 'react'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Database,
  ClipboardCheck,
  Loader2,
} from 'lucide-react'
import { api, getApiErrorMessage } from '../services/api'

const requiredColumns = [
  'farm_id',
  'plot_id',
  'crop',
  'season',
  'soil_type',
  'area_hectares',
  'sowing_date',
  'fertilizer_kg',
  'seed_kg',
  'water_liters',
]

interface ValidationResult {
  valid: boolean
  headers: string[]
  rows: string[][]
  missingColumns: string[]
  recordCount: number
  error?: string
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let insideQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === ',' && !insideQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  values.push(current.trim())
  return values
}

export default function DatasetUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadResult, setUploadResult] = useState<unknown>(null)

  const handleFile = (selectedFile?: File) => {
    setValidation(null)
    setFile(null)
    setUploadError('')
    setUploadResult(null)

    if (!selectedFile) return

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setValidation({
        valid: false,
        headers: [],
        rows: [],
        missingColumns: [],
        recordCount: 0,
        error: 'Only CSV files are supported.',
      })
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setValidation({
        valid: false,
        headers: [],
        rows: [],
        missingColumns: [],
        recordCount: 0,
        error: 'File size exceeds the 10 MB limit.',
      })
      return
    }

    setFile(selectedFile)
    setProcessing(true)

    const reader = new FileReader()

    reader.onload = () => {
      const content = String(reader.result || '')
      const lines = content
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0)

      if (lines.length < 2) {
        setValidation({
          valid: false,
          headers: [],
          rows: [],
          missingColumns: requiredColumns,
          recordCount: 0,
          error: 'The CSV must contain a header and at least one data record.',
        })
        setProcessing(false)
        return
      }

      const headers = parseCSVLine(lines[0]).map((header) =>
        header.trim().toLowerCase(),
      )

      const missingColumns = requiredColumns.filter(
        (column) => !headers.includes(column),
      )

      const rows = lines.slice(1).map(parseCSVLine)

      setValidation({
        valid: missingColumns.length === 0,
        headers,
        rows: rows.slice(0, 5),
        missingColumns,
        recordCount: rows.length,
      })

      setProcessing(false)
    }

    reader.onerror = () => {
      setValidation({
        valid: false,
        headers: [],
        rows: [],
        missingColumns: [],
        recordCount: 0,
        error: 'Unable to read this file.',
      })
      setProcessing(false)
    }

    reader.readAsText(selectedFile)
  }

  const uploadDataset = async () => {
    if (!file || !validation?.valid || uploading) return

    setUploading(true)
    setUploadError('')
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/datasets/upload', formData)
      setUploadResult(response.data)
    } catch (error) {
      setUploadError(
        getApiErrorMessage(error, 'Dataset upload failed. Please try again.'),
      )
    } finally {
      setUploading(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setValidation(null)
    setUploadError('')
    setUploadResult(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Agricultural Dataset Upload
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Import agricultural input and yield records for data validation,
          comparative analysis and anomaly detection.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <FileSpreadsheet className="mb-3 text-emerald-600" size={23} />
          <h3 className="font-semibold text-gray-900">CSV Ingestion</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select agricultural records in CSV format.
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <ClipboardCheck className="mb-3 text-sky-600" size={23} />
          <h3 className="font-semibold text-gray-900">Schema Validation</h3>
          <p className="mt-1 text-sm text-gray-500">
            Check required columns before processing.
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <Database className="mb-3 text-amber-600" size={23} />
          <h3 className="font-semibold text-gray-900">Data Processing</h3>
          <p className="mt-1 text-sm text-gray-500">
            Prepare records for analytical processing.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Select Agricultural Dataset
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload a CSV file containing crop input and yield information.
        </p>

        <label
          htmlFor="dataset-file"
          className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-12 text-center transition hover:border-emerald-500 hover:bg-emerald-50/40"
        >
          <Upload className="mb-3 text-emerald-600" size={35} />
          <span className="font-semibold text-gray-800">
            Click to browse your CSV file
          </span>
          <span className="mt-2 text-sm text-gray-500">
            CSV format only · Maximum file size: 10 MB
          </span>

          <input
            id="dataset-file"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={uploading}
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>

        {file && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <FileSpreadsheet className="shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={clearFile}
              disabled={uploading}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              aria-label="Remove selected file"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {processing && (
          <p className="mt-4 text-sm text-gray-500">
            Reading and validating CSV...
          </p>
        )}

        {validation && (
          <div
            className={`mt-4 rounded-lg border p-4 ${
              validation.valid
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-center gap-2">
              {validation.valid ? (
                <CheckCircle2 className="text-emerald-700" size={20} />
              ) : (
                <AlertTriangle className="text-red-600" size={20} />
              )}

              <p className="font-semibold text-gray-900">
                {validation.valid
                  ? 'CSV structure validation passed'
                  : 'CSV validation failed'}
              </p>
            </div>

            {validation.error && (
              <p className="mt-2 text-sm text-red-700">
                {validation.error}
              </p>
            )}

            {validation.valid && (
              <p className="mt-2 text-sm text-emerald-800">
                {validation.recordCount} records detected.
                All required columns are present.
              </p>
            )}

            {validation.missingColumns.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-red-700">
                  Missing required columns:
                </p>
                <ul className="mt-1 list-inside list-disc text-sm text-red-700">
                  {validation.missingColumns.map((column) => (
                    <li key={column}>{column}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {validation?.valid && file && (
          <button
            type="button"
            onClick={uploadDataset}
            disabled={uploading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Uploading and processing...
              </>
            ) : (
              <>
                <Upload size={19} />
                Upload and Process Dataset
              </>
            )}
          </button>
        )}

        {uploadError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={19} />
              Upload failed
            </div>
            <p className="mt-2">{uploadError}</p>
          </div>
        )}

        {uploadResult !== null && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-emerald-800">
              <CheckCircle2 size={20} />
              Dataset successfully submitted for processing
            </div>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-3 text-xs text-gray-700">
              {JSON.stringify(uploadResult, null, 2)}
            </pre>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Required CSV Schema
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Your dataset should contain the following required columns.
          Harvest date and yield are optional.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {requiredColumns.map((column) => (
            <div
              key={column}
              className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700"
            >
              {column}
            </div>
          ))}
        </div>
      </section>

      {validation?.headers.length ? (
        <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Dataset Preview
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Showing up to the first five records. Total records:{' '}
              {validation.recordCount}.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {validation.headers.map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className="whitespace-nowrap px-3 py-3"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {validation.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {validation.headers.map((header, columnIndex) => (
                      <td
                        key={`${header}-${columnIndex}`}
                        className="whitespace-nowrap px-3 py-3 text-gray-700"
                      >
                        {row[columnIndex] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}
