import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layers, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { farmService, fieldService } from '../services'
import { getApiErrorMessage } from '../services/api'
import type { Farm, Field, FieldStatus } from '../types'

const statusOptions: FieldStatus[] = ['HEALTHY', 'MODERATE', 'ATTENTION']
const filterOptions: Array<FieldStatus | 'ALL'> = ['ALL', 'HEALTHY', 'MODERATE', 'ATTENTION']

const emptyForm = {
  name: '',
  cropType: '',
  areaAcres: '',
  status: 'HEALTHY' as FieldStatus,
  farmId: '',
}

export default function FieldsPage() {
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [fields, setFields] = useState<Field[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<FieldStatus | 'ALL'>('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<Field | null>(null)
  const [deleting, setDeleting] = useState<Field | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [offline, setOffline] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [fieldData, farmData] = await Promise.all([fieldService.getAll(), farmService.getAll()])
      setFields(fieldData)
      setFarms(farmData)
      setOffline(false)
    } catch {
      setOffline(true)
      toast(getApiErrorMessage(new Error('Network Error'), 'Could not load fields'), 'error')
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
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state])

  const filtered = useMemo(
    () => (statusFilter === 'ALL' ? fields : fields.filter((f) => f.status === statusFilter)),
    [fields, statusFilter]
  )

  const openCreate = () => {
    if (!farms.length && !offline) {
      toast('Create a farm first before adding fields', 'warning')
      navigate('/farms', { state: { openCreate: true } })
      return
    }
    setEditing(null)
    setForm({
      ...emptyForm,
      farmId: farms[0] ? String(farms[0].id) : '',
    })
    setModalOpen(true)
  }

  const openEdit = (field: Field) => {
    setEditing(field)
    setForm({
      name: field.name,
      cropType: field.cropType || '',
      areaAcres: String(field.areaAcres ?? ''),
      status: field.status,
      farmId: String(field.farmId),
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.farmId || !form.areaAcres) {
      toast('Please fill in name, farm, and area', 'warning')
      return
    }
    setSaving(true)
    const farm = farms.find((f) => f.id === Number(form.farmId))
    const payload = {
      name: form.name.trim(),
      cropType: form.cropType.trim() || 'Mixed',
      areaAcres: Number(form.areaAcres),
      status: form.status,
      farmId: Number(form.farmId),
    }
    try {
      if (editing) {
        const updated = await fieldService.update(editing.id, payload)
        setFields((prev) =>
          prev.map((f) =>
            f.id === editing.id
              ? { ...f, ...updated, farmName: updated.farmName || farm?.name || f.farmName }
              : f
          )
        )
        toast('Field updated successfully', 'success')
      } else {
        const created = await fieldService.create(payload)
        setFields((prev) => [
          ...prev,
          { ...created, farmName: created.farmName || farm?.name },
        ])
        toast('Field created successfully', 'success')
      }
      setModalOpen(false)
    } catch (error) {
      toast(getApiErrorMessage(error, 'Failed to save field'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setSaving(true)
    try {
      await fieldService.remove(deleting.id)
      setFields((prev) => prev.filter((f) => f.id !== deleting.id))
      toast('Field deleted', 'success')
    } catch (error) {
      toast(getApiErrorMessage(error, 'Failed to delete field'), 'error')
    } finally {
      setSaving(false)
      setDeleteOpen(false)
      setDeleting(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Fields"
        subtitle="Browse and manage cultivated field plots"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FieldStatus | 'ALL')}
              className="min-w-[160px]"
            >
              {filterOptions.map((s) => (
                <option key={s} value={s}>
                  {s === 'ALL' ? 'All statuses' : s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Field
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : !filtered.length ? (
        <Card>
          <EmptyState
            title="No fields found"
            description={
              statusFilter === 'ALL'
                ? 'Add your first field to start monitoring soil and crops.'
                : `No fields with status ${statusFilter}.`
            }
            action={
              statusFilter === 'ALL' ? (
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Add Field
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((field) => (
            <Card key={field.id} className="group transition hover:border-brand-200 hover:shadow-md">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <Link
                      to={`/field-monitoring?fieldId=${field.id}`}
                      className="font-semibold text-gray-900 transition hover:text-brand-700"
                    >
                      {field.name}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {field.farmName || `Farm #${field.farmId}`}
                    </p>
                  </div>
                </div>
                <Badge tone={statusTone(field.status)}>{field.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Crop</p>
                  <p className="font-medium text-gray-900">{field.cropType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Area</p>
                  <p className="font-medium text-gray-900">{field.areaAcres} acres</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <Link
                  to={`/field-monitoring?fieldId=${field.id}`}
                  className="text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
                >
                  Open monitoring →
                </Link>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(field)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeleting(field)
                      setDeleteOpen(true)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Field' : 'Add Field'}
      >
        <div className="space-y-4">
          <Input
            label="Field Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Field 1"
          />
          <Select
            label="Farm"
            value={form.farmId}
            onChange={(e) => setForm((f) => ({ ...f, farmId: e.target.value }))}
          >
            <option value="">Select farm</option>
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.name}
              </option>
            ))}
          </Select>
          <Input
            label="Crop Type"
            value={form.cropType}
            onChange={(e) => setForm((f) => ({ ...f, cropType: e.target.value }))}
            placeholder="Paddy, Tomato..."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Area (acres)"
              type="number"
              min="0"
              step="0.1"
              value={form.areaAcres}
              onChange={(e) => setForm((f) => ({ ...f, areaAcres: e.target.value }))}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FieldStatus }))}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleSave}>
              {editing ? 'Save Changes' : 'Create Field'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Field">
        <p className="text-sm text-gray-600">
          Delete <span className="font-semibold text-gray-900">{deleting?.name}</span>? This cannot be
          undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
