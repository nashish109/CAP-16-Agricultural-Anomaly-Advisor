
import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  ChevronDown,
  Layers,
  MapPinned,
  Menu,
  Plus,
  Search,
  Sprout,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui'
import { useAlertCount } from '../hooks/useAlertCount'

interface HeaderProps {
  onMenuClick: () => void
  title?: string
  subtitle?: string
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const addNewOptions = [
  { label: 'New Farm', icon: MapPinned, to: '/farms', state: { openCreate: true } },
  { label: 'New Plot', icon: Layers, to: '/fields', state: { openCreate: true } },
  { label: 'New Crop Cycle', icon: Sprout, to: '/crop-management', state: { openCreate: true } },
] as const

export default function Header({ onMenuClick, title, subtitle }: HeaderProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const alertCount = useAlertCount()

  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)

  const firstName = user?.fullName?.split(' ')[0] || 'Farmer'

  useEffect(() => {
    if (!addMenuOpen) return

    const handleClick = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)

    return () => document.removeEventListener('mousedown', handleClick)
  }, [addMenuOpen])

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/90 backdrop-blur-lg">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
              {title || (
                <>
                  {getGreeting()}, {firstName}!{' '}
                  <span className="hidden font-normal text-gray-500 sm:inline">
                    {subtitle ||
                      'Your agricultural input and yield intelligence at a glance.'}
                  </span>
                </>
              )}
            </h1>

            {!title && (
              <p className="mt-0.5 truncate text-sm text-gray-500 sm:hidden">
                {subtitle ||
                  'Your agricultural input and yield intelligence at a glance.'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search farms, plots, crop cycles..."
              aria-label="Search farms, plots and crop cycles"
              className="input-pro w-56 rounded-lg py-2 pl-9 pr-3 text-sm lg:w-72"
            />
          </div>

          {/* Notifications */}
          <button
            type="button"
            onClick={() => navigate('/alerts')}
            className="relative rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition hover:border-gray-300 hover:bg-gray-50"
            aria-label="Alerts"
          >
            <Bell className="h-4 w-4" />

            {alertCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white ring-2 ring-white">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>

          {/* Add New Menu */}
          <div className="relative hidden sm:block" ref={addMenuRef}>
            <Button onClick={() => setAddMenuOpen((open) => !open)}>
              <Plus className="h-4 w-4" />
              Add New
              <ChevronDown
                className={`h-3.5 w-3.5 opacity-70 transition ${
                  addMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </Button>

            {addMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {addNewOptions.map(({ label, icon: Icon, to, state }) => (
                  <button
                    key={label}
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                    onClick={() => {
                      setAddMenuOpen(false)
                      navigate(to, { state })
                    }}
                  >
                    <Icon className="h-4 w-4 text-gray-400" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
