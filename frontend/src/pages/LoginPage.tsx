import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Globe, Leaf, Lock, Mail, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button, Modal } from '../components/ui'
import AuthBrandPanel from '../components/AuthBrandPanel'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.1 14.6 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z" />
      <path fill="#34A853" d="M3.6 7.4l3.2 2.4C7.6 8 9.6 6.6 12 6.6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.1 14.6 2 12 2 8.2 2 4.9 4.1 3.6 7.4z" />
      <path fill="#FBBC05" d="M12 22c2.5 0 4.6-.8 6.1-2.2l-3-2.4c-.8.6-1.9 1-3.1 1-3.9 0-5.3-2.5-5.5-3.8H3.5v2.5C4.8 19.9 8.1 22 12 22z" />
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.2-.2-1.7H12v3.9h5.5c-.3 1.4-1.2 2.4-2.4 3.1l3 2.4c1.8-1.6 3.5-4.1 3.5-7.7z" />
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 23 23" className="h-4 w-4" aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M12 1h10v10H12z" />
      <path fill="#00A4EF" d="M1 12h10v10H1z" />
      <path fill="#FFB900" d="M12 12h10v10H12z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 0.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.3c.6-1.1 1-2.2 1-2.3-.1 0-2.3-.9-2.3-3.8zM14.6 6.1c.6-.8 1.1-1.8 1-2.9-1 .1-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.8 1.1.1 2.1-.6 2.8-1.4z" />
    </svg>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('pugalini@agrisense.com')
  const [password, setPassword] = useState('password123')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [forgotOpen, setForgotOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('pugalini@agrisense.com')

  const validate = () => {
    const e: Record<string, string> = {}
    if (!email.includes('@')) e.email = 'Enter a valid email'
    if (password.length < 6) e.password = 'Password must be at least 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login(email, password)
      toast('Welcome back!', 'success')
      navigate('/dashboard')
    } catch {
      toast('Invalid email or password. If the backend is offline, start it first.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const socialSignIn = (provider: string) => {
    toast(`${provider} sign-in is not enabled yet. Use the demo account below.`, 'info')
  }

  return (
    <div className="flex min-h-screen bg-[#eef5ef]">
      <AuthBrandPanel />

      <div className="flex w-full flex-col justify-center px-4 py-8 sm:px-8 lg:w-[44%] lg:px-10">
        <div className="mx-auto w-full max-w-[440px] rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(20,83,45,0.08)] sm:p-9">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-base font-medium text-brand-700 hover:text-brand-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-medium text-gray-600">
              <Globe className="h-3.5 w-3.5" />
              English
            </span>
          </div>

          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-gray-900">AgriSense</span>
          </div>

          <h2 className="text-4xl font-bold tracking-tight text-gray-900">Welcome back!</h2>
          <p className="mt-2 text-base text-gray-500">Sign in to access your AgriSense dashboard</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-base font-medium text-gray-700">Email address</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@farm.com"
                  className="auth-input"
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="text-xs text-red-600">{errors.email}</span>}
            </label>

            <label className="block space-y-1.5">
              <span className="text-base font-medium text-gray-700">Password</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="auth-input pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                  onClick={() => setShow(!show)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-red-600">{errors.password}</span>}
            </label>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-base font-medium text-brand-700 hover:text-brand-800"
                onClick={() => setForgotOpen(true)}
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" loading={loading} className="w-full rounded-xl bg-brand-800 py-3.5 text-lg hover:bg-brand-900" size="lg">
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-gray-200" />
            <span className="text-sm font-medium text-gray-400">or continue with</span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => socialSignIn('Google')}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <GoogleIcon />
              Google
            </button>
            <button
              type="button"
              onClick={() => socialSignIn('Microsoft')}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <MicrosoftIcon />
              Microsoft
            </button>
            <button
              type="button"
              onClick={() => socialSignIn('Apple')}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <AppleIcon />
              Apple
            </button>
          </div>

          <p className="mt-7 text-center text-base text-gray-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">
              Create account
            </Link>
          </p>

          <div className="mt-5 flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
              <User className="h-4 w-4" />
            </div>
            <p className="text-sm leading-relaxed text-brand-800">
              <span className="font-semibold">Demo account:</span> pugalini@agrisense.com / password123
            </p>
          </div>
        </div>
      </div>

      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Reset password">
        <p className="mb-4 text-sm text-gray-600">
          Enter the email for your AgriSense account. We’ll send reset instructions if it exists.
        </p>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-gray-700">Email address</span>
          <input
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            className="auth-input !pl-3.5"
          />
        </label>
        <Button
          className="mt-5 w-full"
          onClick={() => {
            setForgotOpen(false)
            toast('If that email is registered, reset instructions have been sent.', 'success')
          }}
        >
          Send reset link
        </Button>
      </Modal>
    </div>
  )
}
