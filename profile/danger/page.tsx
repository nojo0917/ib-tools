'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function DangerPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState('')
  const [loadingExport, setLoadingExport] = useState(false)
  const [loadingClear, setLoadingClear] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleClearHistory() {
    if (!window.confirm('This will permanently delete all your saved generations. Continue?')) return
    setLoadingClear(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('generations').delete().eq('user_id', user.id)
    setLoadingClear(false)

    if (error) showToast(error.message, 'error')
    else showToast('Chat history cleared successfully')
  }

  async function handleExport() {
    setLoadingExport(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)

    setLoadingExport(false)

    if (error) { showToast(error.message, 'error'); return }

    const payload = {
      exportedAt: new Date().toISOString(),
      userId: user.id,
      email: user.email,
      generations: data,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'ib-tools-export.json'; a.click()
    URL.revokeObjectURL(url)
    showToast('Data exported successfully')
  }

  async function handleDeleteAccount() {
    if (confirmDelete !== 'DELETE') return

    // Supabase requires admin SDK to delete users server-side.
    // We call a server action / API route you need to create.
    const res = await fetch('/api/account/delete', { method: 'DELETE' })
    if (res.ok) {
      await supabase.auth.signOut()
      router.push('/')
    } else {
      showToast('Could not delete account. Contact support.', 'error')
    }
    setShowDeleteModal(false)
  }

  return (
    <>
      <h1 className="panel-title">Danger Zone</h1>
      <p className="panel-sub">Irreversible actions — please read carefully before proceeding</p>

      <div className="section danger-section">
        <div className="danger-item">
          <div>
            <p className="danger-label">Export my data</p>
            <p className="danger-desc">Download all your generations and account metadata as a JSON file.</p>
          </div>
          <button className="btn btn-ghost" onClick={handleExport} disabled={loadingExport}>
            <i className="ti ti-download" aria-hidden="true" />
            {loadingExport ? 'Exporting…' : 'Export'}
          </button>
        </div>

        <div className="danger-item">
          <div>
            <p className="danger-label">Clear all chat history</p>
            <p className="danger-desc">Permanently deletes all saved generations. This cannot be undone.</p>
          </div>
          <button className="btn btn-danger" onClick={handleClearHistory} disabled={loadingClear}>
            {loadingClear ? 'Clearing…' : 'Clear history'}
          </button>
        </div>

        <div className="danger-item" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div>
            <p className="danger-label">Delete account</p>
            <p className="danger-desc">Permanently removes your account, all generations, and all associated data.</p>
          </div>
          <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
            Delete account
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <p className="modal-title">Delete your account?</p>
            <p className="modal-body">
              This is permanent and cannot be undone. All your generations, preferences,
              and account data will be erased.
            </p>
            <p className="modal-body" style={{ marginTop: 8 }}>
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              className="modal-input"
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder="DELETE"
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => { setShowDeleteModal(false); setConfirmDelete('') }}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={confirmDelete !== 'DELETE'}
                onClick={handleDeleteAccount}
              >
                Delete my account
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          <i className={`ti ${toast.type === 'success' ? 'ti-check' : 'ti-x'}`} />
          {toast.msg}
        </div>
      )}

      <style jsx>{`
        .danger-section { border-color: rgba(239,68,68,.3); }
        .danger-item {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 14px 0;
          border-bottom: 1px solid var(--border);
        }
        .danger-label { font-size: 13px; color: var(--text); font-weight: 500; }
        .danger-desc { font-size: 12px; color: var(--text3); margin-top: 3px; line-height: 1.5; }
        .modal-backdrop {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,.6);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }
        .modal {
          background: var(--navy2); border: 1px solid var(--border2);
          border-radius: var(--radius-lg); padding: 28px;
          max-width: 420px; width: 100%;
        }
        .modal-title { font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
        .modal-body { font-size: 13px; color: var(--text2); line-height: 1.6; }
        .modal-body strong { color: var(--text); }
        .modal-input {
          width: 100%; margin-top: 12px;
          background: var(--navy); border: 1px solid var(--border2);
          border-radius: 8px; padding: 9px 12px;
          color: var(--text); font-size: 13px; outline: none;
          font-family: inherit;
        }
        .modal-input:focus { border-color: var(--danger); }
        .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
      `}</style>
    </>
  )
}
