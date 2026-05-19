'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Student',
    school: '',
    bio: '',
    avatarUrl: '', // NEW: Added avatar tracking
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      const meta = data.user.user_metadata ?? {}
      const nameParts = (meta.full_name ?? '').split(' ')
      setForm({
        firstName: nameParts[0] ?? '',
        lastName: nameParts.slice(1).join(' ') ?? '',
        email: data.user.email ?? '',
        role: meta.role ?? 'Student',
        school: meta.school ?? '',
        bio: meta.bio ?? '',
        avatarUrl: meta.avatar_url ?? '', // NEW: Fetch existing avatar
      })
    })
  }, [supabase])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // NEW: Function to handle the actual file upload to Supabase Storage
  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `avatar-${Math.random()}.${fileExt}`

      // Upload to the 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get the public URL for the newly uploaded image
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

      // Update the form state with the new URL
      setForm({ ...form, avatarUrl: data.publicUrl })
      showToast('Photo uploaded! Click save to apply changes.', 'success')
      
    } catch (error: any) {
      showToast(error.message || 'Error uploading image. Make sure your "avatars" bucket exists.', 'error')
    } finally {
      setUploading(false)
    }
  }

  // NEW: Function to remove the photo
  function removeAvatar() {
    setForm({ ...form, avatarUrl: '' })
  }

  async function handleSave() {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: `${form.firstName} ${form.lastName}`.trim(),
        role: form.role,
        school: form.school,
        bio: form.bio,
        avatar_url: form.avatarUrl, // NEW: Save the avatar URL to user metadata
      },
    })
    setLoading(false)
    if (error) showToast(error.message, 'error')
    else showToast('Profile updated successfully')
  }

  const initials =
    `${form.firstName?.[0] ?? ''}${form.lastName?.[0] ?? ''}`.toUpperCase() || 'IB'

  return (
    <>
      <h1 className="panel-title">Profile</h1>
      <p className="panel-sub">Manage how you appear on IB Tools</p>

      <div className="section">
        <div className="avatar-edit-row">
          <div className="avatar-lg">
            {/* NEW: Show the image if it exists, otherwise show initials */}
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="Profile" className="avatar-img" />
            ) : (
              initials
            )}
          </div>
          
          <div className="avatar-actions">
            {/* NEW: Hidden file input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={uploadAvatar} 
              accept="image/*" 
              hidden 
            />
            
            {/* NEW: Button triggers the hidden input click */}
            <button 
              className="btn btn-ghost" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <i className="ti ti-upload" aria-hidden="true" /> 
              {uploading ? 'Uploading...' : 'Upload photo'}
            </button>
            
            <button 
              className="btn btn-ghost" 
              style={{ color: 'var(--danger)' }}
              onClick={removeAvatar}
              disabled={!form.avatarUrl}
            >
              Remove
            </button>
          </div>
          <span className="badge badge-success" style={{ marginLeft: 'auto', alignSelf: 'flex-start' }}>
            <i className="ti ti-check" style={{ fontSize: 11 }} /> Verified
          </span>
        </div>

        <div className="field-row">
          <div className="field">
            <label>First name</label>
            <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div className="field">
            <label>Last name</label>
            <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
        </div>

        <div className="field-row full">
          <div className="field">
            <label>Email address</label>
            <input type="email" value={form.email} disabled style={{ opacity: 0.6 }} />
            <span className="field-hint">Contact support to change your email.</span>
          </div>
        </div>

        <div className="field-row full">
          <div className="field">
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option>Student</option>
              <option>Teacher / Educator</option>
              <option>IB Coordinator</option>
              <option>Parent</option>
            </select>
          </div>
        </div>

        <div className="field-row full">
          <div className="field">
            <label>School / Institution</label>
            <input
              placeholder="e.g. Seoul International School"
              value={form.school}
              onChange={(e) => setForm({ ...form, school: e.target.value })}
            />
          </div>
        </div>

        <div className="field-row full">
          <div className="field">
            <label>Bio (optional)</label>
            <textarea
              placeholder="A short description…"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
        </div>

        <div className="save-row">
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            <i className="ti ti-check" aria-hidden="true" />
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          <i className={`ti ${toast.type === 'success' ? 'ti-check' : 'ti-x'}`} />
          {toast.msg}
        </div>
      )}

      <style jsx>{`
        .avatar-edit-row {
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 20px; padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }
        .avatar-lg {
          width: 64px; height: 64px; border-radius: 50%;
          background: linear-gradient(135deg, #3B82F6, #8B5CF6);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 700; color: #fff; flex-shrink: 0;
          overflow: hidden; /* NEW: Keeps the image inside the circle */
        }
        .avatar-img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .avatar-actions { display: flex; flex-direction: column; gap: 6px; }
      `}</style>
    </>
  )
}