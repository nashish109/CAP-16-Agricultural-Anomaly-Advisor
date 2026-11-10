import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CloudSun,
  Droplets,
  Leaf,
  LineChart,
  Play,
  Radio,
  ScanSearch,
  Star,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui'
import AnimateOnScroll from '../components/AnimateOnScroll'
import LandingImage from '../components/LandingImage'

const HERO_BG = '/images/hero-farm.jpg'

const LANDING_IMAGES = {
  hero: '/images/hero-farm.jpg',
  about: '/images/about-farming.jpg',
  articles: {
    soil: '/images/article-soil.jpg',
    tomato: '/images/article-tomato.jpg',
    iot: '/images/article-iot.jpg',
  },
} as const

const features = [
  {
    icon: Activity,
    title: 'Field Monitoring',
    description: 'Real-time soil moisture, temperature, humidity, and sensor data across all your fields.',
  },
  {
    icon: ScanSearch,
    title: 'AI Disease Detection',
    description: 'Upload crop images and get instant disease diagnosis with treatment recommendations.',
  },
  {
    icon: Droplets,
    title: 'Smart Irrigation',
    description: 'Automated watering recommendations based on soil conditions and weather forecasts.',
  },
  {
    icon: LineChart,
    title: 'Yield Predictions',
    description: 'ML-powered yield forecasting to plan harvests and maximize productivity.',
  },
  {
    icon: CloudSun,
    title: 'Weather Intelligence',
    description: '7-day forecasts with farming recommendations for irrigation and harvesting.',
  },
  {
    icon: TrendingUp,
    title: 'Market Insights',
    description: 'Live agricultural market prices with historical trends and crop comparisons.',
  },
]

const stats = [
  { value: '10K+', label: 'Fields monitored', icon: Activity },
  { value: '92%', label: 'Disease detection accuracy', icon: ScanSearch },
  { value: '35%', label: 'Water savings average', icon: Droplets },
  { value: '24/7', label: 'Real-time monitoring', icon: Radio },
  { value: '99.9%', label: 'Uptime reliability', icon: CheckCircle2 },
]

const steps = [
  {
    icon: ClipboardList,
    title: 'Register Your Farm',
    description: 'Create your account and add farms, fields, and crops in minutes.',
  },
  {
    icon: Radio,
    title: 'Connect & Monitor',
    description: 'Link IoT sensors or use our simulator to stream live field data.',
  },
  {
    icon: BarChart3,
    title: 'Optimize & Grow',
    description: 'Track health, receive alerts, and act on AI-powered recommendations.',
  },
]

const testimonials = [
  {
    quote:
      'AgriSense has transformed the way we farm. Disease detection saved our tomato crop, and irrigation recommendations cut our water usage by 30%.',
    name: 'Ramesh Kumar',
    role: 'Paddy Farmer',
    location: 'Jaffna, Sri Lanka',
  },
  {
    quote:
      'The yield predictions helped us plan our harvest perfectly. We increased productivity by 25% in just one season with better field monitoring.',
    name: 'Priya Senthil',
    role: 'Vegetable Farmer',
    location: 'Vavuniya, Sri Lanka',
  },
  {
    quote:
      'Real-time alerts and weather intelligence give us confidence to make decisions quickly. It feels like having an agronomist on call 24/7.',
    name: 'Arun Nadarajah',
    role: 'Chili Farmer',
    location: 'Kilinochchi, Sri Lanka',
  },
]

const articles = [
  {
    tag: 'Farming Tips',
    title: '5 Essential Soil Management Practices for Better Yields',
    date: 'Mar 15, 2024',
    readTime: '5 min read',
    image: LANDING_IMAGES.articles.soil,
  },
  {
    tag: 'Crop Health',
    title: 'Early Signs of Tomato Blight and How to Treat It',
    date: 'Mar 10, 2024',
    readTime: '4 min read',
    image: LANDING_IMAGES.articles.tomato,
  },
  {
    tag: 'Technology',
    title: 'How IoT Sensors Are Revolutionizing Modern Agriculture',
    date: 'Mar 5, 2024',
    readTime: '6 min read',
    image: LANDING_IMAGES.articles.iot,
  },
]

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'for small farms',
    features: ['Up to 3 farms', 'Basic field monitoring', 'Weather forecasts', 'Market prices'],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: 'LKR 2,500',
    period: '/month',
    features: [
      'Unlimited farms & fields',
      'AI disease detection',
      'Yield predictions',
      'Smart irrigation',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    features: ['Custom integrations', 'Dedicated support', 'IoT / MQTT setup', 'On-premise deployment'],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl shadow-black/20 ring-1 ring-black/5">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/90 px-4 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="ml-2 text-[11px] text-gray-400">app.agrisense.com/dashboard</span>
      </div>
      <div className="flex min-h-[320px]">
        <div className="hidden w-14 shrink-0 bg-sidebar sm:block">
          <div className="flex h-full flex-col items-center gap-3 py-4">
            {[Activity, Leaf, ScanSearch, Droplets, CloudSun].map((Icon, i) => (
              <div
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${i === 0 ? 'bg-sidebar-active' : ''}`}
              >
                <Icon className="h-4 w-4 text-white/70" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-gray-50/50 p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Total Farms', value: '3' },
              { label: 'Total Fields', value: '7' },
              { label: 'Total Crops', value: '12' },
              { label: 'Soil Moisture', value: '43.2%' },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm">
                <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">{kpi.label}</p>
                <p className="mt-0.5 text-base font-semibold text-gray-900">{kpi.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-5">
            <div className="col-span-3 rounded-lg border border-gray-100 bg-gradient-to-br from-emerald-50 to-brand-50 p-3">
              <p className="text-[10px] font-semibold text-gray-700">Farm Overview</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {[
                  { name: 'Paddy', status: 'Healthy', color: 'bg-emerald-100 text-emerald-800' },
                  { name: 'Maize', status: 'Moderate', color: 'bg-amber-100 text-amber-800' },
                  { name: 'Chili', status: 'Attention', color: 'bg-red-100 text-red-800' },
                ].map((f) => (
                  <span key={f.name} className={`rounded px-1.5 py-0.5 text-[8px] font-medium ${f.color}`}>
                    {f.name} ({f.status})
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gradient-to-br from-sky-50 to-blue-50 p-3">
              <p className="text-[10px] font-semibold text-gray-700">Weather</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">29°C</p>
              <p className="text-[9px] text-gray-500">Sunny · 62% humidity</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-3">
              <p className="text-[10px] font-semibold text-gray-700">AI Detection</p>
              <p className="mt-1 text-[9px] text-gray-600">Early blight · 92%</p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full w-[92%] rounded-full bg-brand-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [testimonialIdx, setTestimonialIdx] = useState(0)

  const handleGetStarted = () => {
    if (isAuthenticated) navigate('/dashboard')
    else navigate('/register')
  }

  const t = testimonials[testimonialIdx]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <LandingImage
          src={HERO_BG}
          alt="Green farm fields at sunrise"
          className="absolute inset-0 h-full w-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-50/95 via-brand-50/88 to-brand-100/50 dark:from-brand-950/95 dark:via-brand-950/90 dark:to-brand-900/50" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-24">
          <AnimateOnScroll>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-300/50 bg-brand-100/80 px-4 py-2 text-sm font-semibold text-brand-900 dark:border-brand-700 dark:bg-brand-900/60 dark:text-brand-100">
              <Leaf className="h-4 w-4" />
              AI-Powered Smart Farming Platform
            </div>
            <h1 className="landing-heading-xl font-bold tracking-tight text-brand-900 dark:text-brand-50">
              Grow Smarter.
              <br />
              Farm Better.
            </h1>
            <p className="landing-body-lg mt-6 max-w-lg text-brand-900/80 dark:text-brand-100/85">
              Monitor your farms in real time, detect crop diseases early, optimize irrigation, and predict
              yields — all from one professional platform built for modern farmers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" onClick={handleGetStarted} className="min-w-[170px] shadow-md shadow-brand-600/25">
                {isAuthenticated ? 'Open Dashboard' : 'Get Started Free'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/register')}
                className="min-w-[170px] border-brand-400 bg-white text-brand-900 hover:bg-brand-50 dark:border-brand-600 dark:bg-brand-900/50 dark:text-brand-50 dark:hover:bg-brand-900/80"
              >
                <Play className="h-4 w-4 fill-brand-700 text-brand-700 dark:fill-brand-300 dark:text-brand-300" />
                Book a Demo
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2">
                {['PS', 'RK', 'AN', 'MK'].map((initials, i) => (
                  <div
                    key={initials}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand-50 bg-brand-600 text-[10px] font-semibold text-white dark:border-brand-950"
                    style={{ zIndex: 4 - i }}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-1 text-base text-brand-900/75 dark:text-brand-100/80">
                  Trusted by <span className="font-bold text-brand-900 dark:text-brand-50">50,000+</span> farmers worldwide
                </p>
              </div>
            </div>
          </AnimateOnScroll>
          <AnimateOnScroll delay={150} className="relative lg:pl-4">
            <div className="hero-float">
              <DashboardPreview />
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-brand-200/40 bg-brand-50/60 py-10 dark:border-brand-800/40 dark:bg-brand-950/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:px-6 md:grid-cols-3 lg:grid-cols-5 lg:gap-8 lg:px-8">
          {stats.map(({ value, label, icon: Icon }, i) => (
            <AnimateOnScroll key={label} delay={i * 80}>
              <div className="landing-card flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-brand-900 dark:text-brand-100">{value}</p>
                  <p className="text-sm leading-snug text-brand-800/75 dark:text-brand-200/80">{label}</p>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
              <Leaf className="h-5 w-5 text-brand-700" />
            </div>
            <h2 className="landing-heading-lg font-bold tracking-tight text-brand-900 dark:text-brand-50">
              Everything you need to manage your farm
            </h2>
            <p className="landing-body-lg mt-5 text-brand-900/75 dark:text-brand-100/80">
              From real-time monitoring to AI-powered insights, AgriSense gives you complete control over
              your agricultural operations.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }, i) => (
              <AnimateOnScroll key={title} delay={i * 90}>
                <div className="landing-card group h-full p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 transition group-hover:bg-brand-200 dark:bg-brand-900 dark:text-brand-300 dark:group-hover:bg-brand-800">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-xl font-semibold text-brand-900 dark:text-brand-50">{title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-brand-900/75 dark:text-brand-100/80">{description}</p>
                  <a
                    href="#features"
                    className="mt-5 inline-flex items-center gap-1 text-base font-semibold text-brand-700 transition hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-100"
                  >
                    Learn more
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </a>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-brand-200/40 bg-brand-100/40 py-20 dark:border-brand-800/40 dark:bg-brand-950/30 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="landing-heading-lg font-bold tracking-tight text-brand-900 dark:text-brand-50">How it works</h2>
            <p className="landing-body-lg mt-5 text-brand-900/75 dark:text-brand-100/80">Get started in three simple steps</p>
          </div>
          <div className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
            <div className="absolute left-[16.67%] right-[16.67%] top-10 hidden h-0.5 border-t-2 border-dashed border-brand-300 dark:border-brand-700 md:block" />
            {steps.map(({ icon: Icon, title, description }, i) => (
              <AnimateOnScroll key={title} delay={i * 120}>
                <div className="relative text-center">
                  <div className="landing-card relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl p-0">
                    <Icon className="h-8 w-8 text-brand-700 dark:text-brand-300" strokeWidth={1.5} />
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-brand-900 dark:text-brand-50">{title}</h3>
                  <p className="mx-auto mt-3 max-w-xs text-base leading-relaxed text-brand-900/75 dark:text-brand-100/80">{description}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <AnimateOnScroll>
              <h2 className="landing-heading-lg font-bold tracking-tight text-brand-900 dark:text-brand-50">
                Built for farmers, powered by technology
              </h2>
              <p className="landing-body-lg mt-5 text-brand-900/75 dark:text-brand-100/80">
                AgriSense combines IoT sensors, machine learning, and intuitive dashboards to help you make
                better farming decisions every day — whether you manage one field or an entire estate.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  'Real-time sensor data via WebSocket',
                  'AI disease detection with 92% accuracy',
                  'Smart irrigation recommendations',
                  'Yield predictions and market insights',
                  'Responsive dashboard for any device',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-base text-brand-900 dark:text-brand-100">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="mt-8" onClick={handleGetStarted}>
                Start monitoring today
                <ArrowRight className="h-4 w-4" />
              </Button>
            </AnimateOnScroll>
            <AnimateOnScroll delay={120}>
              <div className="landing-card relative overflow-hidden p-0">
                <LandingImage
                  src={LANDING_IMAGES.about}
                  alt="Farmer using technology in the field"
                  className="h-full min-h-[320px] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/50 to-transparent" />
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-brand-200/40 bg-brand-100/50 py-20 dark:border-brand-800/40 dark:bg-brand-950/50 sm:py-24">
        <AnimateOnScroll className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="landing-heading-lg font-bold tracking-tight text-brand-900 dark:text-brand-50">Loved by farmers everywhere</h2>
          <blockquote className="landing-body-lg mt-10 font-medium leading-relaxed text-brand-900/90 dark:text-brand-50/95 sm:text-2xl">
            &ldquo;{t.quote}&rdquo;
          </blockquote>
          <p className="mt-6 text-lg font-semibold text-brand-800 dark:text-brand-200">{t.name}</p>
          <p className="text-base text-brand-800/70 dark:text-brand-200/75">
            {t.role} · {t.location}
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setTestimonialIdx((i) => (i - 1 + testimonials.length) % testimonials.length)}
              className="landing-card rounded-full p-2 text-brand-700 dark:text-brand-300"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTestimonialIdx(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === testimonialIdx ? 'w-6 bg-brand-600' : 'w-2 bg-brand-300 dark:bg-brand-700'
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setTestimonialIdx((i) => (i + 1) % testimonials.length)}
              className="landing-card rounded-full p-2 text-brand-700 dark:text-brand-300"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </AnimateOnScroll>
      </section>

      {/* Latest insights */}
      <section id="insights" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="landing-heading-lg font-bold tracking-tight text-brand-900 dark:text-brand-50">Latest Insights & Tips</h2>
              <p className="mt-3 text-lg text-brand-900/75 dark:text-brand-100/80">Expert advice and farming best practices</p>
            </div>
            <a
              href="#insights"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              View all articles
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, i) => (
              <AnimateOnScroll key={article.title} delay={i * 100}>
                <article className="landing-card group h-full overflow-hidden p-0">
                  <div className="aspect-[16/10] overflow-hidden bg-brand-50 dark:bg-brand-900">
                    <LandingImage
                      src={article.image}
                      alt={article.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <span className="inline-block rounded-md bg-brand-100 px-2.5 py-1 text-sm font-semibold text-brand-900 dark:bg-brand-900 dark:text-brand-100">
                      {article.tag}
                    </span>
                    <h3 className="mt-3 text-lg font-semibold leading-snug text-brand-900 group-hover:text-brand-700 dark:text-brand-50 dark:group-hover:text-brand-300">
                      {article.title}
                    </h3>
                    <div className="mt-3 flex items-center gap-3 text-sm text-brand-800/70 dark:text-brand-200/75">
                      <span>{article.date}</span>
                      <span>·</span>
                      <span>{article.readTime}</span>
                    </div>
                  </div>
                </article>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-brand-200/40 bg-brand-100/40 py-20 dark:border-brand-800/40 dark:bg-brand-950/30 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="landing-heading-lg font-bold tracking-tight text-brand-900 dark:text-brand-50">Simple, transparent pricing</h2>
            <p className="landing-body-lg mt-5 text-brand-900/75 dark:text-brand-100/80">Choose the plan that fits your farm size</p>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {plans.map((plan, i) => (
              <AnimateOnScroll key={plan.name} delay={i * 100}>
                <div
                  className={`landing-card flex h-full flex-col p-6 ${
                    plan.highlighted ? 'ring-2 ring-brand-600 dark:ring-brand-500' : ''
                  }`}
                >
                  {plan.highlighted && (
                    <span className="mb-3 inline-block w-fit rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-xl font-semibold text-brand-900 dark:text-brand-50">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-brand-900 dark:text-brand-50">{plan.price}</span>
                    <span className="text-base text-brand-800/70 dark:text-brand-200/75">{plan.period}</span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-base text-brand-900/80 dark:text-brand-100/85">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.highlighted ? 'primary' : 'outline'}
                    className="mt-6 w-full"
                    onClick={handleGetStarted}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-brand-800 py-16 dark:bg-brand-950 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,222,128,0.15),transparent_60%)]" />
        <AnimateOnScroll className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="landing-heading-lg font-bold tracking-tight text-white">
            Ready to transform your farming?
          </h2>
          <p className="landing-body-lg mt-5 leading-relaxed text-white/90">
            Join thousands of farmers using AgriSense to grow healthier crops, save water, and increase yields.
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="landing-cta-btn mt-10 min-w-[240px]"
          >
            {isAuthenticated ? 'Open Dashboard' : 'Get Started Free'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </AnimateOnScroll>
      </section>
    </div>
  )
}
