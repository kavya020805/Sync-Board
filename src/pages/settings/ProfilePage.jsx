import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useThemeStore } from '@/stores/themeStore'
import { supabase } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'
import { Camera, Loader2, User } from 'lucide-react'
import { toast } from 'sonner'
import Lanyard from '@/components/animations/Lanyard'

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const { theme } = useThemeStore()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [frontImage, setFrontImage] = useState(null)
  const fileInputRef = useRef(null)

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty')
      return
    }

    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', profile.id)

    setSaving(false)

    if (error) {
      toast.error('Failed to update profile')
    } else {
      await refreshProfile()
      toast.success('Profile updated')
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB')
      return
    }

    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.id}.${fileExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      setUploading(false)
      toast.error('Failed to upload avatar')
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', profile.id)

    setUploading(false)

    if (updateError) {
      toast.error('Failed to update avatar')
    } else {
      await refreshProfile()
      toast.success('Avatar updated')
    }
  }

  // Generate the texture map for the 3D lanyard card
  useEffect(() => {
    if (!profile) return

    const isDark = theme === 'dark'
    const colors = {
      bg: isDark ? '#09090b' : '#ffffff',
      textMain: isDark ? '#f8fafc' : '#0f172a',
      textSub: isDark ? '#94a3b8' : '#64748b',
      badgeBg: isDark ? 'rgba(99, 102, 241, 0.2)' : '#f8fafc',
      badgeBorder: isDark ? 'rgba(99, 102, 241, 0.4)' : '#e2e8f0',
      badgeText: isDark ? '#a5b4fc' : '#475569',
      avatarFallbackBg: isDark ? '#1e1b4b' : '#1e1b4b',
      avatarFallbackText: '#ffffff',
      avatarBorder: isDark ? '#312e81' : '#e2e8f0',
    }

    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 1800
    const ctx = canvas.getContext('2d')
    
    // Background
    ctx.fillStyle = colors.bg
    ctx.fillRect(0, 0, 1200, 1800)
    
    const draw = async () => {
       // Draw text
       ctx.fillStyle = colors.textMain
       ctx.font = '800 100px Inter, system-ui, sans-serif'
       ctx.textAlign = 'center'
       ctx.fillText(displayName || profile?.display_name || 'Guest User', 600, 1000)
       
       ctx.fillStyle = colors.textSub
       ctx.font = '600 48px Inter, system-ui, sans-serif'
       ctx.fillText(profile?.email || '', 600, 1100)
       
       // Draw member badge
       ctx.fillStyle = colors.badgeBg
       ctx.beginPath()
       ctx.roundRect(240, 1500, 720, 120, 60)
       ctx.fill()
       ctx.strokeStyle = colors.badgeBorder
       ctx.lineWidth = 6
       ctx.stroke()
       
       ctx.fillStyle = colors.badgeText
       ctx.font = 'bold 40px Inter, system-ui, sans-serif'
       ctx.fillText('SYNC BOARD MEMBER', 600, 1576)
       
       const drawAvatar = (img) => {
          ctx.save()
          ctx.beginPath()
          ctx.arc(600, 500, 220, 0, Math.PI * 2)
          ctx.closePath()
          ctx.clip()
          if (img) {
             ctx.drawImage(img, 380, 280, 440, 440)
          } else {
             ctx.fillStyle = colors.avatarFallbackBg
             ctx.fill()
             ctx.fillStyle = colors.avatarFallbackText
             ctx.font = 'bold 180px Inter, system-ui, sans-serif'
             ctx.textBaseline = 'middle'
             ctx.fillText((displayName || profile?.display_name)?.charAt(0)?.toUpperCase() || 'U', 600, 500)
             ctx.textBaseline = 'alphabetic'
          }
          ctx.restore()
          
          // Avatar border
          ctx.beginPath()
          ctx.arc(600, 500, 220, 0, Math.PI * 2)
          ctx.strokeStyle = colors.avatarBorder
          ctx.lineWidth = 16
          ctx.stroke()
       }

       if (profile?.avatar_url) {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
             drawAvatar(img)
             setFrontImage(canvas.toDataURL('image/png'))
          }
          img.onerror = () => {
             drawAvatar(null)
             setFrontImage(canvas.toDataURL('image/png'))
          }
          img.src = profile.avatar_url
       } else {
          drawAvatar(null)
          setFrontImage(canvas.toDataURL('image/png'))
       }
    }
    
    draw()
  }, [profile, displayName, theme])

  if (!profile) return null

  return (
    <div className="w-full h-[calc(100vh-120px)] min-h-[600px] flex flex-col lg:flex-row gap-8 animate-fade-in relative z-0">
      
      {/* 3D Lanyard Preview */}
      <div className="flex-1 rounded-3xl bg-(--color-bg-secondary) border border-(--color-border-subtle) relative overflow-hidden shadow-2xl flex items-center justify-center min-h-[500px]">
        <div className="absolute inset-0 z-0">
           {frontImage && <Lanyard position={[0, -2, 16]} frontImage={frontImage} transparent={true} />}
        </div>
        
        {/* Decorative backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
        
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-xs text-(--color-text-tertiary) font-bold uppercase tracking-widest pointer-events-none">
           <span>Interactive Badge</span>
           <span>Drag to swing</span>
        </div>
      </div>

      {/* Edit Form */}
      <div className="w-full lg:w-[450px] bg-(--color-bg-secondary) border border-(--color-border-subtle) rounded-3xl p-8 flex flex-col shadow-2xl relative z-10">
        <h1 className="text-2xl font-bold text-(--color-text-primary) mb-2">Edit Profile</h1>
        <p className="text-sm text-(--color-text-secondary) mb-8 leading-relaxed">Customize your digital badge. Your changes are previewed live on the lanyard.</p>

        <div className="space-y-6">
           {/* Avatar Upload */}
           <div>
             <p className="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wider mb-4">Badge Photo</p>
             <div className="flex items-center gap-5">
               <div className="relative group">
                 {profile.avatar_url ? (
                   <img
                     src={profile.avatar_url}
                     alt="Avatar"
                     className="w-20 h-20 rounded-2xl object-cover border-2 border-(--color-border-default) shadow-md"
                   />
                 ) : (
                   <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-2xl font-bold border-2 border-indigo-500/20 shadow-md">
                     {getInitials(profile.display_name || profile.email)}
                   </div>
                 )}

                 <button
                   onClick={() => fileInputRef.current?.click()}
                   disabled={uploading}
                   className="absolute inset-0 w-20 h-20 rounded-2xl bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer border border-white/10"
                 >
                   {uploading ? (
                     <Loader2 className="w-5 h-5 text-white animate-spin" />
                   ) : (
                     <>
                        <Camera className="w-5 h-5 text-white mb-1" />
                        <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change</span>
                     </>
                   )}
                 </button>

                 <input
                   ref={fileInputRef}
                   type="file"
                   accept="image/*"
                   onChange={handleAvatarUpload}
                   className="hidden"
                 />
               </div>
               <div>
                  <p className="text-sm text-(--color-text-primary) font-medium">Upload new photo</p>
                  <p className="text-xs text-(--color-text-tertiary) mt-1 max-w-[200px] leading-relaxed">JPG or PNG. Max size of 2MB.</p>
               </div>
             </div>
           </div>

           <div className="h-px w-full bg-(--color-border-subtle) my-2" />

           {/* Form Fields */}
           <div>
              <label className="block text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wider mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-(--color-border-default) bg-(--color-bg-primary) text-sm text-(--color-text-primary) focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                placeholder="Enter your name"
              />
           </div>

           <div>
              <label className="block text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full h-11 px-4 rounded-xl border border-(--color-border-subtle) bg-(--color-bg-primary)/50 text-sm text-(--color-text-tertiary) cursor-not-allowed"
              />
              <p className="text-[11px] text-(--color-text-tertiary) mt-2 font-medium">Contact support to change your email address.</p>
           </div>
        </div>

        <div className="mt-auto pt-8">
           <button
             onClick={handleSave}
             disabled={saving || displayName === profile.display_name}
             className="w-full h-11 rounded-xl text-sm font-bold text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
             style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
           >
             {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile Changes'}
           </button>
        </div>
      </div>
    </div>
  )
}
