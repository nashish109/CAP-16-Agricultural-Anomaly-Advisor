import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Leaf } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button, Input } from '../components/ui'
import AuthBrandPanel from '../components/AuthBrandPanel'

export default function RegisterPage() {
  const { register } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    location: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email.includes('@')) e.email = 'Valid email required'
    if (form.phone.length < 8) e.phone = 'Valid phone required'
    if (form.password.length < 6) e.password = 'Min 6 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    if (!form.location.trim()) e.location = 'Location is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        location: form.location,
      })
      toast('Account created successfully!', 'success')
      navigate('/dashboard')
    } catch {
      toast('Registration failed. Email may already be in use, or backend is offline.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#eef5ef]">
      <AuthBrandPanel />

      <div className="flex w-full flex-col justify-center px-4 py-8 sm:px-8 lg:w-[44%] lg:px-10">
        <div className="mx-auto w-full max-w-[480px] rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(20,83,45,0.08)] sm:p-9">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-base font-medium text-brand-700 hover:text-brand-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">AgriSense</span>
          </div>

          <div className="mb-7">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Create account</h1>
            <p className="mt-2 text-base text-gray-500">Fill in your details to get started</p>
          </div>

          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Full Name"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                error={errors.fullName}
                placeholder="Your full name"
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              error={errors.email}
              placeholder="you@farm.com"
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              error={errors.phone}
              placeholder="+94 77 123 4567"
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              error={errors.password}
            />
            <Input
              label="Confirm Password"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => set('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
            />
            <div className="sm:col-span-2">
              <Input
                label="Location"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                error={errors.location}
                placeholder="Jaffna, Sri Lanka"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" loading={loading} className="w-full rounded-xl bg-brand-800 hover:bg-brand-900" size="lg">
                Create account
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
