
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  MapPinned,
  Plus,
  Pencil,
  Trash2,
  Sprout,
  Layers,
  Map,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Skeleton,
} from '../components/ui'
import { useToast } from '../context/ToastContext'
import { farmService } from '../services'
import { getApiErrorMessage } from '../services/api'
import type { Farm } from '../types'

const emptyForm = {
  name: '',
  location: '',
  areaAcres: '',
  description: '',
}

export default function FarmsPage() {
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<Farm | null>(null)
  const [deleting, setDeleting] = useState<Farm | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)

    try {
      const data = await farmService.getAll()
      setFarms(data)
    } catch (error) {
      toast(getApiErrorMessage(error, 'Could not load farms'), 'error')
      setFarms([])
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
      openCreate()
      navigate(location.pathname, {
        replace: true,
        state: {},
      })
    }
  }, [location.state])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (farm: Farm) => {
    setEditing(farm)

    setForm({
      name: farm.name,
      location: farm.location,
      areaAcres: String(farm.areaAcres ?? ''),
      description: farm.description || '',
    })

    setModalOpen(true)
  }

  const handleSave = async () => {
    const area = Number(form.areaAcres)

    if (
      !form.name.trim() ||
      !form.location.trim() ||
      !form.areaAcres.trim() ||
      !Number.isFinite(area) ||
      area <= 0
    ) {
      toast('Enter a farm name, location and valid area greater than zero', 'warning')
      return
    }

    setSaving(true)

    const payload = {
      name: form.name.trim(),
      location: form.location.trim(),
      areaAcres: area,
      description: form.description.trim() || undefined,
    }

    try {
      if (editing) {
        const updated = await farmService.update(editing.id, payload)

        setFarms((prev) =>
          prev.map((farm) =>
            farm.id === editing.id
              ? { ...farm, ...updated }
              : farm
          )
        )

        toast('Farm updated successfully', 'success')
      } else {
        const created = await farmService.create(payload)

        setFarms((prev) => [
          ...prev,
          { ...created, fieldCount: 0, cropCount: 0 },
        ])

        toast('Farm registered successfully', 'success')
      }

      setModalOpen(false)
    } catch (error) {
      toast(getApiErrorMessage(error, 'Failed to save farm'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return

    setSaving(true)

    try {
      await farmService.remove(deleting.id)

      setFarms((prev) =>
        prev.filter((farm) => farm.id !== deleting.id)
      )

      toast('Farm deleted successfully', 'success')
      setDeleteOpen(false)
      setDeleting(null)
    } catch (error) {
      toast(getApiErrorMessage(error, 'Failed to delete farm'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const totalPlots = farms.reduce(
    (sum, farm) => sum + (farm.fieldCount ?? 0),
    0
  )

  const totalArea = farms.reduce(
    (sum, farm) => sum + (farm.areaAcres ?? 0),
    0
  )

  const totalCropRecords = farms.reduce(
    (sum, farm) => sum + (farm.cropCount ?? 0),
    0
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Farms & Plots"
        subtitle="Register farms, manage agricultural land holdings and organize plots for crop-cycle analysis."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Register Farm
          </Button>
        }
      />

      {/* Farm Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Registered Farms</p>
            <MapPinned className="h-5 w-5 text-emerald-600" />
          </div>
          <h2 className="mt-3 text-3xl font-bold text-gray-900">
            {loading ? '—' : farms.length}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Farms available for analysis
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Registered Plots</p>
            <Layers className="h-5 w-5 text-emerald-600" />
          </div>
          <h2 className="mt-3 text-3xl font-bold text-gray-900">
            {loading ? '—' : totalPlots}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Plots associated with farms
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Farm Area</p>
            <Map className="h-5 w-5 text-emerald-600" />
          </div>
          <h2 className="mt-3 text-3xl font-bold text-gray-900">
            {loading ? '—' : totalArea.toLocaleString()}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Acres of registered farmland
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Crop Records</p>
            <Sprout className="h-5 w-5 text-emerald-600" />
          </div>
          <h2 className="mt-3 text-3xl font-bold text-gray-900">
            {loading ? '—' : totalCropRecords}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Existing crop records
          </p>
        </Card>
      </div>

      {/* Farm List */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Registered Farms
          </h2>
          <p className="text-sm text-gray-500">
            Manage farms and their associated agricultural plots.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate('/fields')}
        >
          <Layers className="h-4 w-4" />
          View All Plots
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48" />
          ))}
        </div>
      ) : farms.length === 0 ? (
        <Card>
          <EmptyState
            title="No farms registered"
            description="Register your first farm to begin managing plots and crop-cycle data."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Register Farm
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {farms.map((farm) => (
            <Card key={farm.id} className="flex flex-col">
              <div className="mb-4 flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <MapPinned className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {farm.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {farm.location}
                    </p>
                  </div>
                </div>

                <Badge tone="success">
                  {farm.areaAcres} ac
                </Badge>
              </div>

              {farm.description && (
                <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                  {farm.description}
                </p>
              )}

              <div className="mt-auto grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3">
                <div>
                  <p className="text-xs text-gray-500">
                    Registered Plots
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {farm.fieldCount ?? 0}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Crop Records
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {farm.cropCount ?? 0}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/fields')}
                >
                  <Layers className="h-4 w-4" />
                  Manage Plots
                </Button>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(farm)}
                    aria-label={`Edit ${farm.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setDeleting(farm)
                      setDeleteOpen(true)
                    }}
                    aria-label={`Delete ${farm.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Farm Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          if (!saving) setModalOpen(false)
        }}
        title={editing ? 'Edit Farm Details' : 'Register New Farm'}
      >
        <div className="space-y-4">
          <Input
            label="Farm Name"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                name: event.target.value,
              }))
            }
            placeholder="e.g. Green Valley Farm"
          />

          <Input
            label="Location"
            value={form.location}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                location: event.target.value,
              }))
            }
            placeholder="e.g. Vijayawada, Andhra Pradesh"
          />

          <Input
            label="Total Area (acres)"
            type="number"
            min={0.1}
            step={0.1}
            value={form.areaAcres}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                areaAcres: event.target.value,
              }))
            }
            placeholder="e.g. 25"
          />

          <Input
            label="Description"
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
            placeholder="Optional farm details"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              loading={saving}
              onClick={handleSave}
            >
              {editing ? 'Save Changes' : 'Register Farm'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={deleteOpen}
        onClose={() => {
          if (!saving) setDeleteOpen(false)
        }}
        title="Delete Farm"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{' '}
          <strong>{deleting?.name}</strong>?
        </p>

        <p className="mt-2 text-sm text-red-600">
          This action cannot be undone. Review any associated
          plots and crop records before deleting this farm.
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
            Delete Farm
          </Button>
        </div>
      </Modal>
    </div>
  )
}
