import {
  Activity,
  BarChart3,
  Droplets,
  Leaf,
  Radio,
  ScanSearch,
  Users,
} from 'lucide-react'
import LandingImage from './LandingImage'

const features = [
  { icon: BarChart3, text: 'Real-time farm analytics and KPI monitoring' },
  { icon: ScanSearch, text: 'AI-powered crop disease detection' },
  { icon: Droplets, text: 'Smart irrigation and yield predictions' },
]

const stats = [
  { icon: Users, value: '10K+', label: 'Farmers' },
  { icon: Activity, value: '25K+', label: 'Fields Monitored' },
  { icon: ScanSearch, value: '92%', label: 'Detection Accuracy' },
  { icon: Radio, value: '24/7', label: 'Real-time Monitoring' },
]

export default function AuthBrandPanel() {
  return (
    <aside className="relative hidden min-h-screen overflow-hidden lg:flex lg:w-[56%] lg:flex-col">
      <LandingImage
        src="/images/hero-farm.jpg"
        alt="Green crop fields"
        className="absolute inset-0 h-full w-full object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-brand-50/35 to-brand-950/55" />

      <div className="relative z-10 flex h-full flex-col px-10 py-8 xl:px-14">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 shadow-md">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight text-brand-900">AgriSense</p>
            <p className="text-sm font-medium text-gray-600">Enterprise AgriTech Platform</p>
          </div>
        </div>

        <div className="my-auto max-w-xl py-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-white/70 px-3.5 py-1.5 text-sm font-semibold text-brand-800 backdrop-blur-sm">
            <Leaf className="h-4 w-4" />
            AI-Powered Smart Farming
          </div>
          <h1 className="text-[2.75rem] font-bold leading-[1.15] tracking-tight text-gray-800 xl:text-[3.25rem]">
            Intelligent farming starts with{' '}
            <span className="text-brand-600">better data</span>.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-gray-600">
            Monitor crops, optimize irrigation, detect diseases early, and make data-driven decisions across all your fields.
          </p>

          <ul className="mt-8 space-y-3">
            {features.map(({ icon: Icon, text }, i) => (
              <li
                key={text}
                className="auth-feature-card flex items-center gap-3 rounded-xl border border-white/50 bg-white/45 px-4 py-3.5 text-base font-medium text-gray-800 shadow-sm backdrop-blur-md"
                style={{ animationDelay: `${180 + i * 120}ms` }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="auth-stats-bar rounded-2xl bg-brand-900/80 px-5 py-4 backdrop-blur-md">
          <div className="grid grid-cols-4 gap-3">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0 text-brand-300" />
                <div>
                  <p className="text-xl font-bold leading-none text-white">{value}</p>
                  <p className="mt-1 text-xs leading-tight text-white/75">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-sm text-white/80">&copy; {new Date().getFullYear()} AgriSense. All rights reserved.</p>
      </div>
    </aside>
  )
}
