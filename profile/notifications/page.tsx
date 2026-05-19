'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const EMAIL_PREFS = [
  { key: 'rateLimitWarning', title: 'Rate limit warnings', desc: 'Alert when you reach 80% of your hourly limit' },
  { key: 'featureAnnouncements', title: 'New feature announcements', desc: 'Be the first to know about new tools' },
  { key: 'weeklyDigest', title: 'Weekly usage digest', desc: 'A summary of your study activity each week' },
  { key: 'securityAlerts', title: 'Security alerts', desc: 'Login from a new device or unusual location' },
]

const APP_PREFS = [
  { key: 'saveConfirmation', title: 'Chat history saved', desc: 'Show a toast when a generation is saved' },
  { key: 'modelStatus', title: 'AI model status alerts', desc: 'Notify if the free model is temporarily unavailable' },
  { key: 'pinConfirmation', title: 'Pin / rename confirmations', desc: 'Toast when sidebar items are modified' },
]

type Prefs = Record<string, boolean>

const DEFAULTS: Prefs = {
  rateLimitWarning: true,
  featureAnnouncements: true,
  weeklyDigest: false,
  securityAlerts: true,
  saveConfirmation: true,
  modelStatus: true,
  pinConfirmation: false,
}

export default function NotificationsPage() {
  const supabase = createClientComponentClient()
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const saved = data.user?.user_metadata?.notifPrefs
      if (saved) setPrefs({ ...DEFAULTS, ...saved })
    })
  }, [supabase])

  function toggle(key: string) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }))
  }

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave() {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ data: { notifPrefs: prefs } })
    setLoading(false)
    if (error) showToast(error.message, 'error')
    else showToast('Notification preferences saved')
  }

  function ToggleRow({ k, title, desc }: { k: string; title: string; desc: string }) {
    return (
      <div className="toggle-row">
        <div className="toggle-info">
          <p className="toggle-title">{title}</p>
          <p className="toggle-desc">{desc}</p>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={!!prefs[k]} onChange={() => toggle(k)} />
          <span className="toggle-slider" />
        </label>
      </div>
    )
  }

  return (
    <>
      <h1 className="panel-title">Notifications</h1>
      <p className="panel-sub">Control what alerts you receive</p>

      <div className="section">
        <p className="section-title">Email notifications</p>
        {EMAIL_PREFS.map((p) => <ToggleRow key={p.key} k={p.key} title={p.title} desc={p.desc} />)}
      </div>

      <div className="section">
        <p className="section-title">In-app notifications</p>
        {APP_PREFS.map((p) => <ToggleRow key={p.key} k={p.key} title={p.title} desc={p.desc} />)}
      </div>

      <div className="save-row">
        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
          <i className="ti ti-check" aria-hidden="true" />
          {loading ? 'Saving…' : 'Save preferences'}
        </button>
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          <i className={`ti ${toast.type === 'success' ? 'ti-check' : 'ti-x'}`} />
          {toast.msg}
        </div>
      )}
    </>
  )
}
