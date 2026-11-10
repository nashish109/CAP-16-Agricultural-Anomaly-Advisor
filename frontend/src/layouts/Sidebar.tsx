
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MapPinned,
  CalendarDays,
  Sprout,
  FileUp,
  ClipboardCheck,
  ChartNoAxesCombined,
  GitCompareArrows,
  TriangleAlert,
  Bell,
  FileBarChart,
  Settings,
  LogOut,
  X,
  Leaf,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAlertCount } from '../hooks/useAlertCount'

const dashboardLink = {
  to: '/dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard,
}

const navGroups = [
  {
    label: 'DATA MANAGEMENT',
    items: [
      { to: '/farms', label: 'Farms & Plots', icon: MapPinned },
      { to: '/crop-management', label: 'Crop Cycles', icon: CalendarDays },
      { to: '/dataset-upload', label: 'Dataset Upload', icon: FileUp },
      { to: '/data-quality', label: 'Data Quality & Profiling', icon: ClipboardCheck },
    ],
  },
  {
    label: 'CROP INTELLIGENCE',
    items: [
      { to: '/crop-input-analysis', label: 'Crop Input Analysis', icon: Sprout },
      { to: '/comparable-plots', label: 'Comparable Plot Analysis', icon: GitCompareArrows },
      { to: '/crop-predictions', label: 'Yield Anomaly Advisor', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { to: '/alerts', label: 'Anomaly Alerts', icon: Bell, badge: true },
      { to: '/reports', label: 'Reports & Power BI', icon: FileBarChart },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const alertCount = useAlertCount()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const displayName = (() => {
    const parts = user?.fullName?.trim().split(/\s+/) || []
    if (parts.length >= 2) return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
    return parts[0] || 'Farmer'
  })()

  const DashboardIcon = dashboardLink.icon

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-white/5 bg-sidebar text-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 shadow-sm">
              <Leaf className="h-[18px] w-[18px] text-white" />
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-tight">CAP-16</p>
              <p className="text-[11px] font-medium text-white/45">
                Crop Intelligence Advisor
              </p>
            </div>
          </div>

          <button
            type="button"
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          <div>
            <NavLink
              to={dashboardLink.to}
              end
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-active text-white shadow-sm'
                    : 'text-white/65 hover:bg-sidebar-hover hover:text-white'
                }`
              }
            >
              <DashboardIcon
                className="h-[17px] w-[17px] shrink-0 opacity-90"
                strokeWidth={1.75}
              />
              <span className="flex-1">{dashboardLink.label}</span>
            </NavLink>
          </div>

          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="section-label mb-2 px-3">{group.label}</p>

              <div className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon, badge }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                        isActive
                          ? 'bg-sidebar-active text-white shadow-sm'
                          : 'text-white/65 hover:bg-sidebar-hover hover:text-white'
                      }`
                    }
                  >
                    <Icon
                      className="h-[17px] w-[17px] shrink-0 opacity-90"
                      strokeWidth={1.75}
                    />
                    <span className="flex-1">{label}</span>

                    {badge && alertCount > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold">
                        {alertCount > 9 ? '9+' : alertCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/8 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5 ring-1 ring-white/5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {(user?.fullName || 'F').charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-[11px] text-white/45">Farmer</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-red-500/15 hover:text-red-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log Out
          </button>
        </div>
      </aside>
    </>
  )
}
