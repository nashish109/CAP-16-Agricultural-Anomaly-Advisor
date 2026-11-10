import { Link, Outlet, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  Leaf,
  Mail,
  MapPin,
  Menu,
  Moon,
  Phone,
  Search,
  Sun,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Button } from '../components/ui'

const navLinks = [
  { href: '/', label: 'Home', isRoute: true },
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#about', label: 'About Us' },
]

const resourceLinks = [
  { href: '#insights', label: 'Blog & Articles' },
  { href: '#how-it-works', label: 'Getting Started Guide' },
  { href: '#features', label: 'Feature Documentation' },
  { href: '#pricing', label: 'Plans & Pricing' },
]

const socialLinks = [
  {
    label: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: 'Twitter',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
]

export default function PublicLayout() {
  const { isAuthenticated } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const resourcesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!resourcesOpen) return
    const handleClick = (e: MouseEvent) => {
      if (resourcesRef.current && !resourcesRef.current.contains(e.target as Node)) {
        setResourcesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [resourcesOpen])

  const scrollTo = (href: string) => {
    setMobileOpen(false)
    setResourcesOpen(false)
    if (href.startsWith('#')) {
      const el = document.querySelector(href)
      el?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className={`public-shell min-h-screen ${isDark ? 'dark' : ''}`}>
      <header className="public-header sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 shadow-sm">
              <Leaf className="h-[18px] w-[18px] text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-brand-900 dark:text-brand-50">AgriSense</span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-base font-medium text-brand-800/70 transition hover:text-brand-700 dark:text-brand-100/70 dark:hover:text-brand-300"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault()
                    scrollTo(link.href)
                  }}
                  className="text-base font-medium text-brand-800/70 transition hover:text-brand-700 dark:text-brand-100/70 dark:hover:text-brand-300"
                >
                  {link.label}
                </a>
              ),
            )}
            <div className="relative" ref={resourcesRef}>
              <button
                type="button"
                onClick={() => setResourcesOpen((o) => !o)}
                className="flex items-center gap-1 text-base font-medium text-brand-800/70 transition hover:text-brand-700 dark:text-brand-100/70 dark:hover:text-brand-300"
              >
                Resources
                <ChevronDown className={`h-3.5 w-3.5 transition ${resourcesOpen ? 'rotate-180' : ''}`} />
              </button>
              {resourcesOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-brand-200/60 bg-white py-1.5 shadow-lg dark:border-brand-800 dark:bg-brand-950">
                  {resourceLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault()
                        scrollTo(item.href)
                      }}
                      className="block px-4 py-2 text-sm text-brand-900 transition hover:bg-brand-50 hover:text-brand-800 dark:text-brand-100 dark:hover:bg-brand-900 dark:hover:text-brand-300"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="hidden items-center gap-2 sm:gap-3 lg:flex">
            <button
              type="button"
              className="rounded-lg p-2 text-brand-700/60 transition hover:bg-brand-100 hover:text-brand-800 dark:text-brand-300/70 dark:hover:bg-brand-900 dark:hover:text-brand-200"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-track relative flex h-8 w-14 items-center rounded-full p-0.5"
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              <span
                className={`theme-toggle-thumb flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm dark:bg-brand-800 ${
                  isDark ? 'translate-x-6' : 'translate-x-0'
                }`}
              >
                {isDark ? (
                  <Moon className="h-3.5 w-3.5 text-brand-200" />
                ) : (
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                )}
              </span>
            </button>
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')}>Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button onClick={() => navigate('/register')}>Get Started</Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-gray-600 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-brand-200/40 bg-brand-50/80 px-4 py-4 dark:border-brand-800/40 dark:bg-brand-950/90 lg:hidden">
            <div className="mb-4 flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 dark:bg-brand-900/60">
              <span className="text-sm font-medium text-brand-800 dark:text-brand-100">Theme</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="theme-toggle-track relative flex h-8 w-14 items-center rounded-full p-0.5"
                aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                <span
                  className={`theme-toggle-thumb flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm dark:bg-brand-800 ${
                    isDark ? 'translate-x-6' : 'translate-x-0'
                  }`}
                >
                  {isDark ? (
                    <Moon className="h-3.5 w-3.5 text-brand-200" />
                  ) : (
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </span>
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-brand-900 hover:bg-brand-100/80 dark:text-brand-50 dark:hover:bg-brand-900"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-brand-900 hover:bg-brand-100/80 dark:text-brand-50 dark:hover:bg-brand-900"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollTo(link.href)
                    }}
                  >
                    {link.label}
                  </a>
                ),
              )}
              <p className="mt-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-brand-600/70 dark:text-brand-400/70">
                Resources
              </p>
              {resourceLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm text-brand-800/80 hover:bg-brand-100/80 dark:text-brand-200/80 dark:hover:bg-brand-900"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollTo(item.href)
                  }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-brand-200/40 pt-4 dark:border-brand-800/40">
              {isAuthenticated ? (
                <Button className="w-full" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                  <Button className="w-full" onClick={() => navigate('/register')}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <Outlet />

      <footer className="public-footer border-t">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
                  <Leaf className="h-[18px] w-[18px] text-white" />
                </div>
                <span className="text-lg font-semibold text-brand-900 dark:text-brand-50">AgriSense</span>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-800/70 dark:text-brand-200/70">
                Empowering farmers with AI-driven insights, real-time monitoring, and smart tools to grow
                healthier crops and build sustainable farms.
              </p>
              <div className="mt-5 flex gap-3">
                {socialLinks.map(({ label, icon }) => (
                  <a
                    key={label}
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-200/60 bg-white/80 text-brand-700/70 transition hover:border-brand-400 hover:text-brand-800 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-300/70 dark:hover:border-brand-600 dark:hover:text-brand-200"
                    aria-label={label}
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-brand-900 dark:text-brand-50">Platform</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-brand-800/70 dark:text-brand-200/70">
                <li><a href="#features" className="hover:text-brand-700 dark:hover:text-brand-300">Features</a></li>
                <li><a href="#pricing" className="hover:text-brand-700 dark:hover:text-brand-300">Pricing</a></li>
                <li><Link to="/register" className="hover:text-brand-700 dark:hover:text-brand-300">Get Started</Link></li>
                <li><Link to="/login" className="hover:text-brand-700 dark:hover:text-brand-300">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-brand-900 dark:text-brand-50">Resources</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-brand-800/70 dark:text-brand-200/70">
                <li><a href="#insights" className="hover:text-brand-700 dark:hover:text-brand-300">Blog</a></li>
                <li><a href="#how-it-works" className="hover:text-brand-700 dark:hover:text-brand-300">Documentation</a></li>
                <li><a href="#features" className="hover:text-brand-700 dark:hover:text-brand-300">Help Center</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-brand-900 dark:text-brand-50">Contact Us</h4>
              <ul className="mt-4 space-y-3 text-sm text-brand-800/70 dark:text-brand-200/70">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                  support@agrisense.com
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                  +94 21 222 3344
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                  Jaffna, Northern Province, Sri Lanka
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-brand-200/40 pt-8 dark:border-brand-800/40 sm:flex-row">
            <p className="text-sm text-brand-700/60 dark:text-brand-300/60">
              &copy; {new Date().getFullYear()} AgriSense. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-brand-700/60 dark:text-brand-300/60">
              <a href="#" className="hover:text-brand-900 dark:hover:text-brand-100">Privacy Policy</a>
              <a href="#" className="hover:text-brand-900 dark:hover:text-brand-100">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
