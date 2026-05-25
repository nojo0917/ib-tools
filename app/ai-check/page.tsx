'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, AlertCircle, Search, Info } from 'lucide-react'

export default function AICheckPage() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const navLinks = [
    { name: 'Home', href: '/home' },
    { name: 'Generate', href: '/generate' },
    { name: 'AI Check', href: '/ai-check' },
    { name: 'AI Polish', href: '/ai-polish' }, 
    { name: 'Practice Papers', href: '/practice-papers' },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleCheck = async () => {
    if (!text || text.length < 50) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/ai-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Check failed. Please try again.')
      } else {
        setResult(data)
      }
    } catch (err) {
      setError('Failed to connect to the analysis engine.')
    }
    setLoading(false)
  }

  const getColor = (score: number) => {
    if (score > 70) return 'text-red-600 dark:text-red-400'
    if (score > 35) return 'text-amber-600 dark:text-yellow-400'
    return 'text-emerald-600 dark:text-emerald-400'
  }

  const getBarColor = (score: number) => {
    if (score > 70) return 'bg-red-500'
    if (score > 35) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  // Prevents "NaN%" by ensuring a number is always passed to the UI
  const displayScore = result?.score !== undefined ? Math.round(result.score) : 0

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 dark:bg-[#0f172a] dark:text-slate-100 transition-colors duration-300">
      
      {/* --- NAVBAR --- */}
      <nav className="w-full bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-14 shrink-0" />
            <Link href="/home">
              <span className="text-xl font-bold text-blue-600 dark:text-white" style={{ fontFamily: 'Georgia, serif' }}>
                IB Study Tools
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl p-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  pathname === link.href
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <button onClick={handleLogout} className="text-sm font-bold text-slate-400 hover:text-red-500 transition">
            Logout
          </button>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 pt-12 space-y-8">
          
          <header className="space-y-2">
            <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">AI Check</h2>
            <p className="text-slate-500 dark:text-slate-400 text-base font-medium">
              Analyze linguistic patterns to detect AI-generated content.
            </p>
          </header>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="relative group">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your text here (minimum 50 characters)..."
              className="w-full border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 h-72 resize-none text-base bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm"
            />
            <div className="absolute bottom-5 right-6 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {text.length} / 5000
            </div>
          </div>

          <button
            onClick={handleCheck}
            disabled={loading || text.length < 50}
            className="w-full bg-slate-900 dark:bg-blue-600 text-white rounded-2xl py-5 font-bold hover:opacity-90 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Analyzing Neural Patterns...' : 'Analyze Text'}
          </button>

          {result && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 space-y-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">AI Probability Score</p>
                <p className={`text-7xl font-black tracking-tighter ${getColor(displayScore)}`}>
                  {displayScore}%
                </p>
                <p className={`text-lg font-bold mt-2 uppercase tracking-tight ${getColor(displayScore)}`}>
                  {result.label}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end text-sm">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Sapling Analysis Engine</span>
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Accuracy Confidence</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${getBarColor(displayScore)}`}
                    style={{ width: `${displayScore}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] pt-4 border-t border-slate-50 dark:border-slate-800">
                <ShieldCheck size={12} className="text-blue-500" />
                Verified Sapling.ai Integration
              </div>
            </div>
          )}

          {/* --- LEGAL DISCLAIMER FOOTER --- */}
          <footer className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="max-w-2xl mx-auto space-y-4">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                <span className="block font-bold mb-1 uppercase tracking-wider text-slate-500 dark:text-slate-400">Legal Disclaimer</span>
                AI detection results are probabilistic and intended for educational guidance only. 
                This feature utilizes the 
                <a 
                  href="https://sapling.ai" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 hover:underline mx-1 font-bold"
                >
                  Sapling.ai API
                </a> 
                to analyze content.
              </p>
              
              <p className="text-[10px] text-slate-400 dark:text-slate-500 italic leading-relaxed">
                IB Study Tools is an independent educational resource and is <strong>not officially affiliated with, endorsed by, or sponsored by Sapling Intelligence (Sapling.ai)</strong>. 
                The accuracy of AI detection can vary and should not be used as sole evidence for academic integrity decisions.
              </p>
            </div>
          </footer>

        </div>
      </main>
    </div>
  )
}