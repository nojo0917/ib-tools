'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

function strengthScore(pw: string) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

const STRENGTH = [
  { label: '', color: 'transparent', w: '0%' },
  { label: 'Too weak', color: '#EF4444', w: '25%' },
  { label: 'Could be stronger', color: '#F59E0B', w: '50%' },
  { label: 'Good password', color: '#3B82F6', w: '75%' },
  { label: 'Strong password', color: '#22C55E', w: '100%' },
]

export default function SecurityPage() {
  const supabase = createClientComponentClient()
  const [current, setCurrent] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [twoFa, setTwoFa] = useState({ email: true, app: false })

  const score = strengthScore(newPw)
  const strength = STRENGTH[score]

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handlePasswordChange() {
    if (!newPw) return showToast('Enter a new password', 'error')
    if (newPw !== confirm) return showToast('Passwords do not match', 'error')
    if (score < 2) return showToast('Password is too weak', 'error')

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setLoading(false)

    if (error) showToast(error.message, 'error')
    else {
      showToast('Password updated successfully')
      setCurrent(''); setNewPw(''); setConfirm('')
    }
  }

  return (
    <>
      <h1 className="panel-title">Password & Security</h1>
      <p className="panel-sub">Update your password and manage two-factor authentication</p>

      <div className="section">
        <p className="section-title">Change password</p>

        <div className="field-row full">
          <div className="field">
            <label>Current password</label>
            <input type="password" placeholder="••••••••" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
        </div>

        <div className="field-row full">
          <div className="field">
            <label>New password</label>
            <input
              type="password"
              placeholder="At least 8 characters"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
            <div className="strength-track">
              <div className="strength-fill" style={{ width: strength.w, background: strength.color }} />
            </div>
            {newPw && <span className="field-hint">{strength.label}</span>}
          </div>
        </div>

        <div className="field-row full">
          <div className="field">
            <label>Confirm new password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={{ borderColor: confirm && confirm !== newPw ? 'var(--danger)' : undefined }}
            />
            {confirm && confirm !== newPw && <span className="field-hint" style={{ color: 'var(--danger)' }}>Passwords do not match</span>}
          </div>
        </div>

        <div className="save-row">
          <button className="btn btn-primary" onClick={handlePasswordChange} disabled={loading}>
            <i className="ti ti-lock" aria-hidden="true" />
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </div>

      <div className="section">
        <p className="section-title">Two-factor authentication</p>

        <div className="toggle-row">
          <div className="toggle-info">
            <p className="toggle-title">Email OTP</p>
            <p className="toggle-desc">Receive a one-time code on login</p>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={twoFa.email} onChange={(e) => setTwoFa({ ...twoFa, email: e.target.checked })} />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="toggle-row">
          <div className="toggle-info">
            <p className="toggle-title">Authenticator app</p>
            <p className="toggle-desc">Use Google Authenticator or Authy</p>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={twoFa.app} onChange={(e) => setTwoFa({ ...twoFa, app: e.target.checked })} />
            <span className="toggle-slider" />
          </label>
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="btn btn-ghost">
            <i className="ti ti-qrcode" aria-hidden="true" /> Set up authenticator app
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
        .strength-track {
          height: 4px; border-radius: 4px;
          background: var(--border); overflow: hidden; margin-top: 8px;
        }
        .strength-fill { height: 100%; border-radius: 4px; transition: width .3s, background .3s; }
      `}</style>
    </>
  )
}
