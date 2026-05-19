'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Supabase doesn't expose session list via client SDK directly,
// so we show the current session and let users sign out all others.
export default function SessionsPage() {
  const supabase = createClient()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
  }, [supabase])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function signOutAll() {
    setLoading(true)
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    setLoading(false)
    if (error) showToast(error.message, 'error')
    else showToast('All sessions signed out')
  }

  function timeFrom(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
  }

  // Detect rough device type from user agent stored in session metadata
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const isMobile = /Mobile|Android|iPhone/i.test(ua)
  const browser = ua.includes('Chrome') ? 'Chrome'
    : ua.includes('Safari') ? 'Safari'
    : ua.includes('Firefox') ? 'Firefox'
    : ua.includes('Edge') ? 'Edge' : 'Browser'

  return (
    <>
      <h1 className="panel-title">Active Sessions</h1>
      <p className="panel-sub">Devices currently signed in to your account</p>

      <div className="section">
        <p className="section-title">Current session</p>

        {session ? (
          <div className="session-item">
            <div className="session-icon">
              <i className={`ti ${isMobile ? 'ti-device-mobile' : 'ti-device-laptop'}`} aria-hidden="true" />
            </div>
            <div className="session-info">
              <p className="session-name">
                {isMobile ? 'Mobile' : 'Desktop'} — {browser}
                <span className="badge badge-success" style={{ marginLeft: 8 }}>Current</span>
              </p>
              <p className="session-meta">
                Signed in {session.created_at ? timeFrom(session.created_at) : 'recently'} ·{' '}
                Expires {session.expires_at ? timeFrom(new Date(session.expires_at * 1000).toISOString()) : 'soon'}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>Loading session…</p>
        )}
      </div>

      <div className="section">
        <p className="section-title">Other sessions</p>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.6 }}>
          Supabase manages sessions server-side. If you believe your account has been accessed
          without permission, sign out all sessions below. You will need to sign back in on all devices.
        </p>
        <button className="btn btn-danger" onClick={signOutAll} disabled={loading}>
          <i className="ti ti-logout" aria-hidden="true" />
          {loading ? 'Signing out…' : 'Sign out all sessions'}
        </button>
      </div>

      <div className="section">
        <p className="section-title">Security tips</p>
        {[
          { icon: 'ti-shield-lock', tip: 'Use a strong, unique password for IB Tools.' },
          { icon: 'ti-device-desktop-off', tip: 'Always sign out on shared or public computers.' },
          { icon: 'ti-bell', tip: 'Enable security alerts in Notifications to be warned of unusual logins.' },
        ].map(({ icon, tip }) => (
          <div key={tip} className="tip-item">
            <i className={`ti ${icon}`} aria-hidden="true" style={{ color: 'var(--accent)', fontSize: 16, flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>{tip}</p>
          </div>
        ))}
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          <i className={`ti ${toast.type === 'success' ? 'ti-check' : 'ti-x'}`} />
          {toast.msg}
        </div>
      )}

      <style jsx>{`
        .session-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 0;
        }
        .session-icon {
          width: 38px; height: 38px; border-radius: 9px;
          background: var(--navy3);
          display: flex; align-items: center; justify-content: center;
          color: var(--text2); font-size: 20px; flex-shrink: 0;
        }
        .session-name { font-size: 13px; color: var(--text); font-weight: 500; }
        .session-meta { font-size: 11px; color: var(--text3); margin-top: 3px; }
        .tip-item {
          display: flex; gap: 10px; align-items: flex-start;
          padding: 9px 0; border-bottom: 1px solid var(--border);
        }
        .tip-item:last-child { border-bottom: none; }
      `}</style>
    </>
  )
}
