import { useEffect, useState } from 'react'
import { Bell, KeyRound, User } from 'lucide-react'
import {
  Button,
  Card,
  Input,
  PageHeader,
} from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()

  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
  })

  const [notifications, setNotifications] = useState({
    irrigation: true,
    weather: true,
    disease: true,
    market: false,
    community: true,
  })

  const [password, setPassword] = useState({
    current: '',
    next: '',
    confirm: '',
  })

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
      })
    }
    const saved = localStorage.getItem('agrisense_notifications')
    if (saved) {
      try {
        setNotifications((prev) => ({ ...prev, ...JSON.parse(saved) }))
      } catch {
        /* ignore */
      }
    }
  }, [user])

  const saveProfile = () => {
    if (!profile.fullName.trim() || !profile.email.trim()) {
      toast('Name and email are required', 'warning')
      return
    }
    updateUser({
      fullName: profile.fullName.trim(),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
      location: profile.location.trim(),
    })
    toast('Profile updated', 'success')
  }

  const saveNotifications = () => {
    localStorage.setItem('agrisense_notifications', JSON.stringify(notifications))
    toast('Notification preferences updated', 'success')
  }

  const changePassword = () => {
    if (!password.current || !password.next || !password.confirm) {
      toast('Fill in all password fields', 'warning')
      return
    }
    if (password.next !== password.confirm) {
      toast('New passwords do not match', 'error')
      return
    }
    if (password.next.length < 6) {
      toast('Password must be at least 6 characters', 'warning')
      return
    }
    setPassword({ current: '', next: '', confirm: '' })
    toast('Password change requires a backend endpoint — not available yet', 'warning')
  }

  const toggle = (key: keyof typeof notifications) => {
    setNotifications((n) => ({ ...n, [key]: !n[key] }))
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your profile, alerts, and security" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Profile"
          action={
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <User className="h-4 w-4" />
            </div>
          }
        >
          <div className="space-y-3">
            <Input
              label="Full Name"
              value={profile.fullName}
              onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
            />
            <Input
              label="Email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
            />
            <Input
              label="Phone"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            />
            <Input
              label="Location"
              value={profile.location}
              onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
            />
            <Button onClick={saveProfile}>Save Profile</Button>
          </div>
        </Card>

        <Card
          title="Notifications"
          action={
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Bell className="h-4 w-4" />
            </div>
          }
        >
          <div className="space-y-3">
            {(
              [
                ['irrigation', 'Irrigation alerts'],
                ['weather', 'Weather advisories'],
                ['disease', 'Disease detection results'],
                ['market', 'Market price changes'],
                ['community', 'Community activity'],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between rounded-xl bg-gray-50 px-3 py-3"
              >
                <span className="text-sm font-medium text-gray-800">{label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifications[key]}
                  onClick={() => toggle(key)}
                  className={`relative h-6 w-11 rounded-full transition ${
                    notifications[key] ? 'bg-brand-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      notifications[key] ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </label>
            ))}
            <Button onClick={saveNotifications}>Save Preferences</Button>
          </div>
        </Card>

        <Card
          title="Change Password"
          className="lg:col-span-2"
          action={
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <KeyRound className="h-4 w-4" />
            </div>
          }
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Current Password"
              type="password"
              value={password.current}
              onChange={(e) => setPassword((p) => ({ ...p, current: e.target.value }))}
            />
            <Input
              label="New Password"
              type="password"
              value={password.next}
              onChange={(e) => setPassword((p) => ({ ...p, next: e.target.value }))}
            />
            <Input
              label="Confirm Password"
              type="password"
              value={password.confirm}
              onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
            />
          </div>
          <div className="mt-4">
            <Button onClick={changePassword}>Update Password</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
