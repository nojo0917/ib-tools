'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const SUBJECTS = [
  { id: 'physics_hl', label: 'Physics HL', icon: 'ti-atom' },
  { id: 'physics_sl', label: 'Physics SL', icon: 'ti-atom' },
  { id: 'maths_aa_hl', label: 'Maths AA HL', icon: 'ti-math-function' },
  { id: 'maths_aa_sl', label: 'Maths AA SL', icon: 'ti-math-function' },
  { id: 'maths_ai_sl', label: 'Maths AI SL', icon: 'ti-calculator' },
  { id: 'biology_hl', label: 'Biology HL', icon: 'ti-dna' },
  { id: 'biology_sl', label: 'Biology SL', icon: 'ti-dna' },
  { id: 'chemistry_hl', label: 'Chemistry HL', icon: 'ti-flask' },
  { id: 'chemistry_sl', label: 'Chemistry SL', icon: 'ti-flask' },
  { id: 'geography_hl', label: 'Geography HL', icon: 'ti-world' },
  { id: 'geography_sl', label: 'Geography SL', icon: 'ti-world' },
  { id: 'history_hl', label: 'History HL', icon: 'ti-building-bank' },
  { id: 'history_sl', label: 'History SL', icon: 'ti-building-bank' },
  { id: 'english_a_hl', label: 'English A HL', icon: 'ti-book' },
  { id: 'english_b_hl', label: 'English B HL', icon: 'ti-language' },
  { id: 'economics_hl', label: 'Economics HL', icon: 'ti-chart-line' },
  { id: 'economics_sl', label: 'Economics SL', icon: 'ti-chart-line' },
  { id: 'psych_hl', label: 'Psychology HL', icon: 'ti-brain' },
  { id: 'cs_hl', label: 'Computer Science HL', icon: 'ti-code' },
  { id: 'visual_arts', label: 'Visual Arts', icon: 'ti-palette' },
  { id: 'tok', label: 'Theory of Knowledge', icon: 'ti-bulb' },
  { id: 'ee', label: 'Extended Essay', icon: 'ti-file-text' },
]

export default function StudyPage() {
  const supabase = createClientComponentClient()
  const [selected, setSelected] = useState<string[]>([])
  const [prefs, setPrefs] = useState({
    programme: 'DP',
    responseStyle: 'Detailed',
    tone: 'Academic',
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata ?? {}
      setSelected(meta.subjects ?? [])
      setPrefs({
        programme: meta.programme ?? 'DP',
        responseStyle: meta.responseStyle ?? 'Detailed',
        tone: meta.tone ?? 'Academic',
      })
    })
  }, [supabase])

  function toggleSubject(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave() {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({
      data: { subjects: selected, ...prefs },
    })
    setLoading(false)
    if (error) showToast(error.message, 'error')
    else showToast('Study preferences saved')
  }

  return (
    <>
      <h1 className="panel-title">Study Preferences</h1>
      <p className="panel-sub">Personalise your Generate experience</p>

      <div className="section">
        <p className="section-title">My subjects</p>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>
          Selected subjects appear first in the subject dropdown on Generate.
        </p>
        <div className="subject-grid">
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              className={`subject-chip${selected.includes(s.id) ? ' selected' : ''}`}
              onClick={() => toggleSubject(s.id)}
            >
              <i className={`ti ${s.icon}`} aria-hidden="true" />
              {s.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 12 }}>
          {selected.length} subject{selected.length !== 1 ? 's' : ''} selected
        </p>
      </div>

      <div className="section">
        <p className="section-title">Default settings</p>
        <div className="field-row">
          <div className="field">
            <label>Response style</label>
            <select value={prefs.responseStyle} onChange={(e) => setPrefs({ ...prefs, responseStyle: e.target.value })}>
              <option>Detailed</option>
              <option>Concise</option>
              <option>Bullet points</option>
              <option>Step-by-step</option>
            </select>
          </div>
          <div className="field">
            <label>AI tone</label>
            <select value={prefs.tone} onChange={(e) => setPrefs({ ...prefs, tone: e.target.value })}>
              <option>Academic</option>
              <option>Friendly tutor</option>
              <option>Socratic</option>
              <option>Exam coach</option>
            </select>
          </div>
        </div>
        <div className="field-row full">
          <div className="field">
            <label>IB Programme</label>
            <select value={prefs.programme} onChange={(e) => setPrefs({ ...prefs, programme: e.target.value })}>
              <option value="DP">DP — Diploma Programme</option>
              <option value="MYP">MYP — Middle Years Programme</option>
              <option value="PYP">PYP — Primary Years Programme</option>
            </select>
          </div>
        </div>
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
        .subject-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .subject-chip {
          padding: 8px 10px; border-radius: 8px;
          border: 1px solid var(--border2);
          background: var(--navy2);
          font-size: 12px; color: var(--text2);
          cursor: pointer; transition: all .15s;
          display: flex; align-items: center; gap: 6px;
          font-family: inherit; text-align: left;
        }
        .subject-chip .ti { font-size: 14px; }
        .subject-chip:hover { border-color: var(--accent); color: var(--text); }
        .subject-chip.selected {
          border-color: var(--accent);
          background: rgba(79,156,249,.1);
          color: var(--accent);
        }
        @media (max-width: 600px) { .subject-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </>
  )
}
