import { Outlet, useLocation } from 'react-router-dom'
import SideRays from '@/components/animations/SideRays'
import BlurText from '@/components/animations/BlurText'
import TrueFocus from '@/components/animations/TrueFocus'

export default function AuthLayout() {
  const location = useLocation()
  
  const isSignUp = location.pathname === '/signup'

  const content = {
    heading: isSignUp ? 'Start collaborating with your team today' : 'Manage projects with your team in real time',
    subheading: isSignUp 
      ? 'Join thousands of teams already using Sync Board to ship faster and better.' 
      : 'Kanban boards, sprint planning, and team collaboration — all synced live. No bloat, no complexity.',
    features: isSignUp 
      ? ['Free forever', 'Unlimited users', 'Real-time sync'] 
      : ['Real-time sync', 'Kanban boards', 'Sprint planning', 'GitHub integration']
  }
  return (
    <div className="min-h-screen flex bg-(--color-bg-primary)">
      {/* Left Panel — Branding & Animations */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-(--color-bg-primary)">
        <SideRays 
          className="absolute inset-0"
          speed={2}
          rayColor1="#ffffff"
          rayColor2="#4f46e5"
          intensity={1.8}
          spread={2.5}
          origin="top-left"
          tilt={-10}
          saturation={1.5}
          blend={0.7}
          falloff={1.0}
          opacity={1.0}
        />

        <div className="relative z-10 max-w-md px-8 text-center animate-fade-in" key={location.pathname}>
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-md flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-indigo-500/20"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              S
            </div>
            <span className="font-bold text-2xl text-white tracking-tight">Sync Board</span>
          </div>

          <BlurText 
            text={content.heading}
            delay={100}
            animateBy="words"
            className="text-3xl font-bold text-white tracking-tight mb-4 leading-tight justify-center"
          />
          <BlurText 
            text={content.subheading}
            delay={300}
            animateBy="words"
            className="text-white/70 leading-relaxed mb-10 max-w-sm mx-auto font-medium justify-center"
          />

          <TrueFocus 
            items={content.features}
            blurAmount={4}
            itemClassName="inline-block px-4 py-2 rounded-full border border-white/10 text-sm font-medium text-white/90 bg-white/5 backdrop-blur-sm shadow-sm"
          />
        </div>
      </div>

      {/* Right Panel — Auth Forms */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-(--color-bg-secondary) border-l border-(--color-border-subtle)">
        <Outlet />
      </div>
    </div>
  )
}
