'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AICheckPage() {
  const [text, setText] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const navLinks = [
    { name: 'Home', href: '/home' },
    { name: 'Generate', href: '/generate' },
    { name: 'AI Check', href: '/ai-check' },
    { name: 'Humanize', href: '/humanize' },
    { name: 'Past Papers', href: '/past-papers' },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleCheck = async () => {
    if (!text) return
    setLoading(true)
    setError('')
    setResults(null)

    try {
      const res = await fetch('/api/ai-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        setResults(data)
      }
    } catch (err) {
      setError('Failed to connect to server.')
    }
    setLoading(false)
  }

  const getColor = (score: number) => {
    if (score > 70) return 'text-red-600'
    if (score > 40) return 'text-amber-600'
    return 'text-green-600'
  }

  const getBarColor = (score: number) => {
    if (score > 70) return 'bg-red-500'
    if (score > 40) return 'bg-amber-500'
    return 'bg-green-500'
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      
      {/* --- STYLISH TOP NAVBAR --- */}
      <nav className="w-full bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* LOGO */}
          <Link href="/home" className="text-xl font-bold text-slate-900 tracking-tight">
            IB<span className="text-blue-600">.Library</span>
          </Link>

          {/* CENTERED PILL LINKS */}
          <div className="flex items-center gap-1 bg-slate-100/50 border border-slate-100 rounded-xl p-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </div>

          {/* LOGOUT SECTION */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              User
            </div>
            <button 
              onClick={handleLogout}
              className="text-sm font-bold text-slate-400 hover:text-red-500 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* --- PAGE CONTENT --- */}
      <main className="max-w-3xl mx-auto p-6 pt-12 space-y-8">
        
        <header className="space-y-2">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">AI Check</h2>
          <p className="text-slate-500 text-base">
            Paste text to check if it was AI-generated. Results come from two independent detectors.
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="relative group">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your text here (minimum 50 characters)..."
            className="w-full border-2 border-slate-100 rounded-3xl p-6 h-72 resize-none text-base bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
          />
          <div className="absolute bottom-5 right-6 px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {text.length} / 5000
          </div>
        </div>

        <button
          onClick={handleCheck}
          disabled={loading || text.length < 50}
          className="w-full bg-slate-900 text-white rounded-2xl py-5 font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
        >
          {loading ? 'Analyzing patterns...' : 'Analyze Text'}
        </button>

        {loading && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 text-center animate-pulse">
            <p className="text-sm text-blue-700 font-medium">Running deep detection — this may take a few seconds...</p>
          </div>
        )}

        {results && (
          <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-8 shadow-2xl shadow-slate-100/50">
            <div className="text-center bg-slate-50 rounded-2xl p-8 border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Combined AI Probability</p>
              <p className={`text-7xl font-black tracking-tighter ${getColor(results.average)}`}>
                {results.average}%
              </p>
              <p className={`text-lg font-bold mt-2 uppercase tracking-tight ${getColor(results.average)}`}>
                {results.averageLabel}
              </p>
            </div>

            <div className="space-y-8">
              {results.detectors.map((d: any) => (
                <div key={d.service}>
                  <div className="flex justify-between items-end text-sm mb-3">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      {d.service}
                      {d.service.toLowerCase().includes('sapling') && (
                        <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider font-black">
                          Pro
                        </span>
                      )}
                    </span>
                    <span className={`font-bold ${getColor(d.score)}`}>
                      {d.score >= 0 ? `${d.score}% — ${d.label}` : 'Error'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${getBarColor(d.score)}`}
                      style={{ width: `${Math.max(0, d.score)}%` }}
                    />
                  </div>
                  {d.reasoning && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                       <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        <span className="text-slate-900 font-bold mr-1">Analysis:</span> {d.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 text-center border-t border-slate-50 pt-6 uppercase tracking-[0.2em] font-bold">
              Data provided by multi-engine neural analysis
            </p>
          </div>
        )}
      </main>
    </div>
  )
}