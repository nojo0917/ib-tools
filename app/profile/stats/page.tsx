'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const LIMITS = { generate: 50, aicheck: 100, humanize: 50 }

export default function StatsPage() {
  const supabase = createClient()
  const [counts, setCounts] = useState({ generate: 0, aicheck: 0, humanize: 0 })
  const [recent, setRecent] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: rows } = await supabase
        .from('generations')
        .select('id, type, subject, task, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (rows) {
        const todayRows = rows.filter(r => new Date(r.created_at) >= today)
        setCounts({
          generate: todayRows.filter(r => r.type === 'generate').length,
          aicheck: todayRows.filter(r => r.type === 'aicheck').length,
          humanize: todayRows.filter(r => r.type === 'humanize').length,
        })
        setRecent(rows.slice(0, 6))
        setTotal(rows.length)
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const typeIcon: Record<string, string> = {
    generate: 'ti-message-bolt',
    aicheck: 'ti-scan',
    humanize: 'ti-pencil',
  }

  const typeColor: Record<string, string> = {
    generate: 'var(--accent)',
    aicheck: '#A78BFA',
    humanize: '#34D399',
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  function pct(used: number, limit: number) {
    return Math.min(Math.round((used / limit) * 100), 100)
  }

  const barColor = (p: number) => p >= 80 ? 'var(--danger)' : p >= 60 ? 'var(--warning)' : 'var(--accent2)'

  return (
    <>
      <h1 className="panel-title">My Stats</h1>
      <p className="panel-sub">Your usage across all three tools</p>

      <div className="stat-grid">
        {[
          { label: 'Total generations', value: loading ? '…' : total },
          { label: 'Today — Generate', value: loading ? '…' : counts.generate },
          { label: 'Today — AI Checks', value: loading ? '…' : counts.aicheck },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="stat-num">{s.value}</p>
            <p className="stat-label">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="section">
        <p className="section-title">Rate limit — today</p>
        {[
          { key: 'generate', label: 'Generate', color: 'var(--accent2)' },
          { key: 'aicheck', label: 'AI Check', color: '#A78BFA' },
          { key: 'humanize', label: 'Humanize', color: '#34D399' },
        ].map(({ key, label, color }) => {
          const used = counts[key as keyof typeof counts]
          const limit = LIMITS[key as keyof typeof LIMITS]
          const p = pct(used, limit)
          return (
            <div key={key} className="limit-row">
              <div className="limit-meta">
                <span>{label}</span>
                <span className="limit-count">{used} / {limit}</span>
              </div>
              <div className="limit-track">
                <div className="limit-bar" style={{ width: `${p}%`, background: barColor(p) }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="section">
        <p className="section-title">Recent activity</p>
        {loading && <p style={{ color: 'var(--text3)', fontSize: 13 }}>Loading…</p>}
        {!loading && recent.length === 0 && (
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>No activity yet. Start generating!</p>
        )}
        {recent.map((row) => (
          <div key={row.id} className="activity-item">
            <div className="activity-icon" style={{ color: typeColor[row.type] ?? 'var(--accent)' }}>
              <i className={`ti ${typeIcon[row.type] ?? 'ti-bolt'}`} aria-hidden="true" />
            </div>
            <div>
              <p className="activity-text">
                {row.type === 'generate' && <>Generated — <strong>{row.subject}</strong>{row.task ? ` · ${row.task}` : ''}</>}
                {row.type === 'aicheck' && <>AI Check completed</>}
                {row.type === 'humanize' && <>Humanized text</>}
              </p>
              <p className="activity-time">{timeAgo(row.created_at)}</p>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 18px 16px;
          text-align: center;
        }
        .stat-num { font-size: 28px; font-weight: 700; color: var(--text); }
        .stat-label { font-size: 11px; color: var(--text3); margin-top: 4px; }
        .limit-row { margin-bottom: 14px; }
        .limit-row:last-child { margin-bottom: 0; }
        .limit-meta {
          display: flex; justify-content: space-between;
          font-size: 12px; color: var(--text2); margin-bottom: 6px;
        }
        .limit-count { color: var(--text3); }
        .limit-track {
          height: 6px; border-radius: 4px;
          background: var(--border); overflow: hidden;
        }
        .limit-bar { height: 100%; border-radius: 4px; transition: width .4s; }
        .activity-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 0; border-bottom: 1px solid var(--border);
        }
        .activity-item:last-child { border-bottom: none; }
        .activity-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--navy3);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .activity-text { font-size: 12px; color: var(--text2); }
        .activity-text strong { color: var(--text); }
        .activity-time { font-size: 11px; color: var(--text3); margin-top: 3px; }
        @media (max-width: 600px) { .stat-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </>
  )
}
