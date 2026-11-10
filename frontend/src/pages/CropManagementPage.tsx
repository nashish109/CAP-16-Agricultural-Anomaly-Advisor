
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Pencil, Plus, Sprout, Trash2, CalendarDays, Layers3 } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  statusTone,
} from '../components/ui'
import { useToast } from '../context/ToastContext'
import { cropService, fieldService } from '../services'
import { getApiErrorMessage } from '../services/api'
import type { Crop, Field, FieldStatus } from '../types'

const stages = [
  'Seedling',
  'Vegetative',
  'Flowering',
  'Fruiting',
  'Maturity',
  'Harvest',
]

const healthOptions = ['HEALTHY', 'MODERATE', 'ATTENTION'] as const

const emptyForm = {
  name: '',
  variety: '',
  plantingDate: '',
  expectedHarvestDate: '',
  growthStage: 'Vegetative',
  healthStatus: 'HEALTHY' as FieldStatus,
  areaAcres: '',
  fieldId: '',
}

export default function CropManagementPage() {
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  const [crops, setCrops] = useState<Crop[]>([])
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<Crop | null>(null)
  const [deleting, setDeleting] = useState<Crop | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)

    try {
      const [cropData, fieldData] = await Promise.all([
        cropService.getAll(),
        fieldService.getAll(),
      ])

      setCrops(cropData)
      setFields(fieldData)
    } catch (error) {
      toast(getApiErrorMessage(error, 'Could not load crop cycles'), 'error')
      setCrops([])
      setFields([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const state = location.state as { openCreate?: boolean } | null

    if (state?.openCreate) {
      if (fields.length > 0) {
        openCreate()
      }

      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, fields.length])

  const openCreate = () => {
    if (!fields.length) {
      toast('Register a farm and plot before creating a crop cycle', 'warning')
      return
    }

    setEditing(null)

    setForm({
      ...emptyForm,
      fieldId: String(fields[0].id),
    })

    setModalOpen(true)
  }

  const openEdit = (crop: Crop) => {
    setEditing(crop)

    setForm({
      name: crop.name,
      variety: crop.variety || '',
      plantingDate: crop.plantingDate?.slice(0, 10) || '',
      expectedHarvestDate: crop.expectedHarvestDate?.slice(0, 10) || '',
      growthStage: crop.growthStage,
      healthStatus: crop.healthStatus,
      areaAcres: String(crop.areaAcres),
      fieldId: String(crop.fieldId),
    })

    setModalOpen(true)
  }

  const handleSave = async () => {
    if (
      !form.name.trim() ||
      !form.plantingDate ||
      !form.areaAcres ||
      !form.fieldId
    ) {
      toast('Please fill in all required fields', 'warning')
      return
    }

    const area = Number(form.areaAcres)

    if (!Number.isFinite(area) || area <= 0) {
      toast('Enter a valid crop area greater than zero', 'warning')
      return
    }

    if (
      form.expectedHarvestDate &&
      form.expectedHarvestDate < form.plantingDate
    ) {
      toast('Expected harvest date cannot be before planting date', 'warning')
      return
    }

    const selectedField = fields.find(
      (field) => field.id === Number(form.fieldId),
    )

    if (!selectedField) {
      toast('Please select a valid plot', 'warning')
      return
    }

    setSaving(true)

    const payload = {
      name: form.name.trim(),
      variety: form.variety.trim() || undefined,
      plantingDate: form.plantingDate,
      expectedHarvestDate: form.expectedHarvestDate || undefined,
      growthStage: form.growthStage,
      healthStatus: form.healthStatus,
      areaAcres: area,
      fieldId: Number(form.fieldId),
      fieldName: selectedField.name,
    }

    try {
      if (editing) {
        const updated = await cropService.update(editing.id, payload)

        setCrops((previous) =>
          previous.map((crop) =>
            crop.id === editing.id
              ? {
                  ...crop,
                  ...updated,
                  fieldName: selectedField.name,
                }
              : crop,
          ),
        )

        toast('Crop cycle updated successfully', 'success')
      } else {
        const created = await cropService.create(payload)

        setCrops((previous) => [
          ...previous,
          {
            ...created,
            fieldName: selectedField.name,
          },
        ])

        toast('Crop cycle registered successfully', 'success')
      }

      setModalOpen(false)
    } catch (error) {
      toast(getApiErrorMessage(error, 'Failed to save crop cycle'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return

    setSaving(true)

    try {
      await cropService.remove(deleting.id)

      setCrops((previous) =>
        previous.filter((crop) => crop.id !== deleting.id),
      )

      toast('Crop cycle deleted successfully', 'success')
    } catch (error) {
      toast(getApiErrorMessage(error, 'Failed to delete crop cycle'), 'error')
    } finally {
      setSaving(false)
      setDeleteOpen(false)
      setDeleting(null)
    }
  }

  const activeCycles = crops.filter(
    (crop) => crop.growthStage !== 'Harvest',
  ).length

  const completedCycles = crops.filter(
    (crop) => crop.growthStage === 'Harvest',
  ).length

  const totalArea = crops.reduce(
    (total, crop) => total + (Number(crop.areaAcres) || 0),
    0,
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crop Cycles"
        subtitle="Manage crop seasons, planting schedules, growth stages and expected harvests across your plots."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Register Crop Cycle
          </Button>
        }
      />

      {/* Crop cycle summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Registered Cycles</p>
            <Sprout className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-gray-900">
            {loading ? '—' : crops.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Total crop records
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Active Cycles</p>
            <CalendarDays className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-gray-900">
            {loading ? '—' : activeCycles}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Currently growing
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Completed Cycles</p>
            <Layers3 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-gray-900">
            {loading ? '—' : completedCycles}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Marked as harvested
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Cultivated Area</p>
            <Sprout className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-gray-900">
            {loading ? '—' : totalArea.toFixed(1)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Acres across crop records
          </p>
        </Card>
      </div>

      {/* Crop cycle records */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Registered Crop Cycles
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View and maintain crop records associated with agricultural plots.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20" />
            ))}
          </div>
        ) : !crops.length ? (
          <Card>
            <EmptyState
              title="No crop cycles registered"
              description="Register a crop cycle and associate it with one of your existing plots."
              action={
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Register Crop Cycle
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Crop</th>
                    <th className="px-4 py-3 font-medium">Plot</th>
                    <th className="px-4 py-3 font-medium">Area</th>
                    <th className="px-4 py-3 font-medium">Growth Stage</th>
                    <th className="px-4 py-3 font-medium">Sowing Date</th>
                    <th className="px-4 py-3 font-medium">Expected Harvest</th>
                    <th className="px-4 py-3 font-medium">Condition</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {crops.map((crop) => (
                    <tr
                      key={crop.id}
                      className="transition hover:bg-emerald-50/40"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Sprout className="h-4 w-4 shrink-0 text-emerald-600" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {crop.name}
                            </p>
                            {crop.variety && (
                              <p className="text-xs text-gray-500">
                                {crop.variety}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {crop.fieldName || `Plot #${crop.fieldId}`}
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {crop.areaAcres} ac
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {crop.growthStage}
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {crop.plantingDate?.slice(0, 10) || '—'}
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {crop.expectedHarvestDate?.slice(0, 10) || '—'}
                      </td>

                      <td className="px-4 py-4">
                        <Badge tone={statusTone(crop.healthStatus)}>
                          {crop.healthStatus}
                        </Badge>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(crop)}
                            aria-label="Edit crop cycle"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setDeleting(crop)
                              setDeleteOpen(true)
                            }}
                            aria-label="Delete crop cycle"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="grid gap-4 md:hidden">
              {crops.map((crop) => (
                <Card key={crop.id}>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sprout className="h-4 w-4 text-emerald-600" />
                        <p className="font-semibold text-gray-900">
                          {crop.name}
                        </p>
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {crop.variety || 'Variety not specified'}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {crop.fieldName || `Plot #${crop.fieldId}`}
                      </p>
                    </div>

                    <Badge tone={statusTone(crop.healthStatus)}>
                      {crop.healthStatus}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Cultivated Area</p>
                      <p className="mt-1 font-medium">
                        {crop.areaAcres} acres
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Growth Stage</p>
                      <p className="mt-1 font-medium">
                        {crop.growthStage}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Sowing Date</p>
                      <p className="mt-1 font-medium">
                        {crop.plantingDate?.slice(0, 10) || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Expected Harvest</p>
                      <p className="mt-1 font-medium">
                        {crop.expectedHarvestDate?.slice(0, 10) || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(crop)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => {
                        setDeleting(crop)
                        setDeleteOpen(true)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create / Edit crop cycle modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Crop Cycle' : 'Register Crop Cycle'}
      >
        <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <Input
            label="Crop Name"
            value={form.name}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                name: event.target.value,
              }))
            }
            placeholder="e.g. Paddy"
          />

          <Input
            label="Crop Variety"
            value={form.variety}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                variety: event.target.value,
              }))
            }
            placeholder="e.g. Basmati"
          />

          <Select
            label="Associated Plot"
            value={form.fieldId}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                fieldId: event.target.value,
              }))
            }
          >
            <option value="">Select plot</option>
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name}
              </option>
            ))}
          </Select>

          <Input
            label="Cultivated Area (acres)"
            type="number"
            min={0.1}
            step={0.1}
            value={form.areaAcres}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                areaAcres: event.target.value,
              }))
            }
            placeholder="e.g. 10"
          />

          <Input
            label="Sowing / Planting Date"
            type="date"
            value={form.plantingDate}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                plantingDate: event.target.value,
              }))
            }
          />

          <Input
            label="Expected Harvest Date"
            type="date"
            value={form.expectedHarvestDate}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                expectedHarvestDate: event.target.value,
              }))
            }
          />

          <Select
            label="Current Growth Stage"
            value={form.growthStage}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                growthStage: event.target.value,
              }))
            }
          >
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </Select>

          <Select
            label="Crop Condition"
            value={form.healthStatus}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                healthStatus: event.target.value as FieldStatus,
              }))
            }
          >
            {healthOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button loading={saving} onClick={handleSave}>
              {editing ? 'Save Changes' : 'Register Cycle'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Crop Cycle"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete the crop cycle for{' '}
          <strong>{deleting?.name}</strong>? This action cannot be undone.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setDeleteOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            loading={saving}
            onClick={handleDelete}
          >
            Delete Cycle
          </Button>
        </div>
      </Modal>
    </div>
  )
}
