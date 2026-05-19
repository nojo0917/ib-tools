'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Theme = 'dark' | 'light' | 'system'

const DISPLAY_TOGGLES = [
  { key: 'compactSidebar', title: 'Compact sidebar', desc: 'Show only icons in the chat history sidebar' },
  { key: 'wordCount', title: 'Show word count', desc: 'Display an estimated word count on responses' },
  { key: 'reduceMotion', title: 'Reduce motion', desc: 'Disable streaming animations and transitions' },
  { key: 'largerText', title: 'Larger text', desc: 'Increase base font size for readability' },
]

export default function AppearancePage() {
  const supabase = createClientComponentClient()
  const [theme, setTheme] = useState<Theme>('dark')
  const [display, setDisplay] = useState<Record<string, boolean>>({
    compactSidebar: false,
    wordCount: true,
    reduceMotion: false,
    largerText: false,
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata ?? {}
      if (meta.theme) setTheme(meta.theme)
      if (meta.display) setDisplay((d) => ({ ...d, ...meta.display }))
    })
  }, [supabase])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave() {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ data: { theme, display } })
    setLoading(false)
    if (error) showToast(error.message, 'error')
    else showToast('Appearance preferences saved')
  }

  const THEMES: { id: Theme; label: string; preview: string }[] = [
    { id: 'dark', label: 'Dark (default)', preview: '#0B1A2E' },
    { id: 'light', label: 'Light', preview: '#F1F5F9' },
    { id: 'system', label: 'System', preview: 'linear-gradient(90deg,#0B1A2E 50%,#F1F5F9 50%)' },
  ]

  return (
    <>
      <h1 className="panel-title">Appearance</h1>
      <p className="panel-sub">Customise the look and feel of IB Tools</p>

      <div className="section">
        <p className="section-title">Theme</p>
        <div className="theme-grid">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`theme-card${theme === t.id ? ' selected' : ''}`}
              onClick={() => setTheme(t.id)}
            >
              <div
                className="theme-preview"
                style={{ background: t.preview }}
              />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <p className="section-title">Display</p>
        {DISPLAY_TOGGLES.map(({ key, title, desc }) => (
          <div key={key} className="toggle-row">
            <div className="toggle-info">
              <p className="toggle-title">{title}</p>
              <p className="toggle-desc">{desc}</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={!!display[key]}
                onChange={(e) => setDisplay({ ...display, [key]: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        ))}
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

      <style jsx>{`
        .theme-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
        }
        .theme-card {
          background: var(--navy2); border: 1px solid var(--border2);
          border-radius: 10px; padding: 12px; cursor: pointer;
          text-align: center; transition: all .15s; font-family: inherit;
          color: var(--text2); font-size: 12px;
        }
        .theme-card:hover { border-color: var(--accent2); }
        .theme-card.selected { border: 2px solid var(--accent); color: var(--text); }
        .theme-preview {
          width: 100%; height: 44px; border-radius: 6px;
          margin-bottom: 8px; border: 1px solid var(--border);
        }
        @media (max-width: 500px) { .theme-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </>
  )
}
