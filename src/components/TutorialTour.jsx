import React, { useState, useEffect } from 'react'
import { Joyride, STATUS } from 'react-joyride'
import { useThemeStore } from '@/stores/themeStore'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function TutorialTour() {
  const { theme } = useThemeStore()
  const { user } = useAuth()
  
  // Check Supabase user_metadata immediately
  const initialCompleted = user?.user_metadata?.tutorial_completed === true
  const [run, setRun] = useState(false)
  const [isDone, setIsDone] = useState(initialCompleted)

  useEffect(() => {
    if (!initialCompleted && user) {
      // Mark as seen in backend immediately so it never shows again on any device/reload
      supabase.auth.updateUser({
        data: { tutorial_completed: true }
      })
      
      // Delay slightly so the UI has time to render fully
      const timer = setTimeout(() => {
        setRun(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [initialCompleted, user])

  const steps = [
    {
      target: 'body',
      content: (
        <div className="text-left text-(--color-text-primary)">
          <h3 className="text-lg font-bold mb-2">Welcome to Sync Board! 👋</h3>
          <p className="text-sm">Let's take a quick tour to help you get started with managing your projects and workspaces.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.tour-workspace-switcher',
      content: 'Here you can switch between your different Workspaces or create a new one.',
      placement: 'right',
    },
    {
      target: '.tour-dashboard-nav',
      content: 'The Workspace Dashboard gives you a high-level view of all your projects in one place.',
      placement: 'right',
    },
    {
      target: '.tour-analytics-nav',
      content: 'Check out Workspace Analytics to see team velocity, issue trends, and member performance.',
      placement: 'right',
    },
    {
      target: '.tour-create-project',
      content: 'Ready to build? Click here to create a new Project within this workspace.',
      placement: 'right',
    },
    {
      target: '.tour-theme-toggle',
      content: 'Prefer working in the dark? You can toggle between light and dark themes here.',
      placement: 'bottom',
    },
    {
      target: '.tour-profile-menu',
      content: 'Access your profile settings, or log out from this menu.',
      placement: 'bottom-end',
    },
    {
      target: 'body',
      content: (
        <div className="text-left text-(--color-text-primary)">
          <h3 className="text-lg font-bold mb-2">Pro Tips! 🚀</h3>
          <p className="text-sm mb-2">Sync Board is packed with keyboard shortcuts:</p>
          <ul className="text-sm list-disc pl-4 space-y-1">
            <li>Press <kbd className="bg-(--color-bg-elevated) border border-(--color-border-subtle) px-1 rounded text-(--color-text-primary)">Ctrl+K</kbd> to open the global Command Palette.</li>
            <li>Press <kbd className="bg-(--color-bg-elevated) border border-(--color-border-subtle) px-1 rounded text-(--color-text-primary)">?</kbd> to view all keyboard shortcuts.</li>
            <li>Press <kbd className="bg-(--color-bg-elevated) border border-(--color-border-subtle) px-1 rounded text-(--color-text-primary)">N</kbd> while viewing a board to instantly create an issue.</li>
          </ul>
        </div>
      ),
      placement: 'center',
    }
  ]

  const handleJoyrideCallback = (data) => {
    const { status, action, type } = data

    // Catch any type of dismissal, skip, or completion
    if (
      ['finished', 'skipped'].includes(status) || 
      action === 'close' || 
      action === 'skip' ||
      type === 'tour:end'
    ) {
      setRun(false)
      setIsDone(true)
    }
  }

  if (isDone) return null

  // Styling based on current theme
  const isDark = theme === 'dark'
  
  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      locale={{ skip: 'Skip Tutorial', last: 'Finish' }}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backgroundColor: 'transparent',
          primaryColor: '#6366f1',
          textColor: isDark ? '#f8fafc' : '#0f172a',
          overlayColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 1000,
        },
        beaconInner: {
          backgroundColor: isDark ? '#ffffff' : '#4f46e5',
        },
        beaconOuter: {
          borderColor: isDark ? '#ffffff' : '#4f46e5',
          backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(79,70,229,0.2)',
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          color: isDark ? '#f8fafc' : '#0f172a',
        },
        tooltipContainer: {
          textAlign: 'left',
          color: isDark ? '#f8fafc' : '#0f172a',
        },
        tooltipContent: {
          color: isDark ? '#f8fafc' : '#0f172a',
        },
        tooltipTitle: {
          color: isDark ? '#f8fafc' : '#0f172a',
        },
        buttonNext: {
          borderRadius: '6px',
          fontWeight: 500,
          color: '#ffffff', // Primary color is indigo, text should be white
        },
        buttonBack: {
          color: isDark ? '#94a3b8' : '#64748b',
          marginRight: 10,
        },
        buttonSkip: {
          color: isDark ? '#cbd5e1' : '#475569',
          fontSize: '14px',
          fontWeight: 600,
          background: 'none',
          padding: '8px 12px',
        },
        buttonClose: {
          color: isDark ? '#f8fafc' : '#0f172a',
        }
      }}
    />
  )
}
