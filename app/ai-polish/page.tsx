'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AIPolishPage() {
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('Standard') // Fixed the 'invalid style' potential source

  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Ensure these HREFs match your actual folder names exactly
  const navLinks = [
    { name: 'Home', href: '/home' },
    { name: 'Generate', href: '/generate' },
    { name: 'AI Check', href: '/ai-check' },
    { name: 'AI Polish', href: '/ai-polish' }, 
    { name: 'Practice Papers', href: '/practice-papers' },
  ]

  const styles = ['Standard', 'Academic', 'Creative', 'Professional', 'Simple']

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handlePolish = async () => {
    if (!text || text.length < 20) {
      setError('Please enter at least 20 characters.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai-polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, style: selectedStyle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to polish text')
      setResult(data.output)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 dark:bg-[#0f172a] dark:text-slate-100 transition-colors">
      
      {/* --- NAVBAR --- */}
      <nav className="w-full bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-14 shrink-0" aria-hidden="true" />
            <Link href="/home">
              <span className="text-xl font-bold text-blue-600 dark:text-white" style={{ fontFamily: 'Georgia, serif' }}>
                IB Study Tools
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl p-1">
            {navLinks.map((link) => {
              // This check must be exact for the pill highlight to work
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </div>

          <button onClick={handleLogout} className="text-sm font-bold text-slate-400 hover:text-red-500 transition">
            Logout
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 py-12 space-y-8">
        <header className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight">AI Polish</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Refine your grammar and flow while keeping your original voice.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Original Draft</label>
              <div className="flex gap-1">
                {styles.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedStyle(s)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                      selectedStyle === s 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text here..."
              className="w-full h-80 p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:outline-none focus:border-blue-500 transition-all resize-none text-sm leading-relaxed"
            />
            <button
              onClick={handlePolish}
              disabled={loading}
              className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? 'Polishing...' : 'Improve Writing'}
            </button>
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">Polished Version</label>
            <div className="w-full h-80 p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-inner overflow-y-auto text-sm leading-relaxed">
              {result ? (
                <p className="whitespace-pre-wrap">{result}</p>
              ) : (
                <span className="text-slate-400 italic">Your improved text will appear here...</span>
              )}
            </div>
            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
          </div>
        </div>
      </main>
    </div>
  )
}