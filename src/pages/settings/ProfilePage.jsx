import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'
import { Camera, Loader2, User } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()

  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
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

  if (!profile) return null

  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-xl font-bold text-(--color-text-primary) mb-1">Profile Settings</h1>
      <p className="text-sm text-(--color-text-secondary) mb-8">Manage your personal information.</p>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-8">
        <div className="relative group">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border-2 border-(--color-border-default)"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-(--color-accent-muted) text-(--color-accent) flex items-center justify-center text-2xl font-bold border-2 border-(--color-border-default)">
              {getInitials(profile.display_name || profile.email)}
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 w-20 h-20 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
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
          <p className="text-sm font-medium text-(--color-text-primary)">Profile photo</p>
          <p className="text-xs text-(--color-text-tertiary) mt-0.5">
            Click to upload. Max 2MB, JPG or PNG.
          </p>
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-(--color-text-secondary) mb-1.5">
            Display name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-secondary) text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-(--color-text-secondary) mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full h-10 px-3 rounded-md border border-(--color-border-default) bg-(--color-bg-tertiary) text-sm text-(--color-text-tertiary) cursor-not-allowed"
          />
          <p className="text-xs text-(--color-text-tertiary) mt-1">Email cannot be changed.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || displayName === profile.display_name}
          className="h-10 px-5 rounded-md text-sm font-medium bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
