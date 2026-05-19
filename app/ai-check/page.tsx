'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AICheckPage() {
  const [text, setText] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleCheck = async () => {
    if (!text) return
    setLoading(true)
    setError('')
    setResults(null)

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
    setLoading(false)
  }

  const getColor = (score: number) => {
    if (score > 70) return 'text-red-600 dark:text-red-400'
    if (score > 40) return 'text-amber-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getBarColor = (score: number) => {
    if (score > 70) return 'bg-red-500'
    if (score > 40) return 'bg-amber-500'
    return 'bg-green-500'
  }

  return (
    <div className="min-h-screen flex flex-col text-gray-900 bg-white dark:text-white dark:bg-gradient-to-br dark:from-[#15284c] dark:to-[#0a1128]">
      
      {/* Navbar Adaptive */}
      <nav className="border-b border-gray-200 dark:border-white/10 px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-black/10 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-lg text-blue-600 dark:text-white" style={{ fontFamily: 'Georgia, serif' }}>
            IB Study Tools
          </h1>
        </div>
        <div className="flex gap-4 text-sm font-medium">
          <a href="/home" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition">Home</a>
          <a href="/generate" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition">Generate</a>
          <a href="/ai-check" className="font-medium text-blue-600 dark:text-white border-b-2 border-blue-600 dark:border-white pb-1">AI Check</a>
          <a href="/humanize" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition">Humanize</a>
          {/* NEW: Past Papers Link */}
          <a href="/past-papers" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition">Past Papers</a>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition">Logout</button>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6 mt-4">
          
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Check</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Paste text to check if it was AI-generated. Results come from two independent detectors.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-200 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your text here (minimum 50 characters)..."
              className="w-full border border-gray-300 dark:border-white/20 rounded-2xl p-5 h-64 resize-none text-base bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
            />
            <p className="absolute bottom-4 right-5 text-xs font-medium text-gray-400">{text.length}/5000</p>
          </div>

          <button
            onClick={handleCheck}
            disabled={loading || text.length < 50}
            className="w-full bg-blue-600 text-white rounded-xl py-4 font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg active:scale-[0.99]"
          >
            {loading ? 'Analysing...' : 'Analyse Text'}
          </button>

          {loading && (
            <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-white/10 rounded-xl p-6 text-center shadow-lg animate-pulse">
              <p className="text-sm text-gray-500 dark:text-gray-400">Running detection — this may take a few seconds...</p>
            </div>
          )}

          {results && (
            <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-white/10 rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="text-center bg-gray-50 dark:bg-black/20 rounded-xl p-6 border border-gray-100 dark:border-white/5">
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">Combined AI Probability</p>
                <p className={`text-6xl font-black ${getColor(results.average)}`}>
                  {results.average}%
                </p>
                <p className={`text-base font-bold mt-2 uppercase tracking-wide ${getColor(results.average)}`}>
                  {results.averageLabel}
                </p>
              </div>

              <div className="border-t border-gray-100 dark:border-white/10 pt-6 space-y-8">
                {results.detectors.map((d: any) => (
                  <div key={d.service}>
                    <div className="flex justify-between items-end text-sm mb-3">
                      <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        {d.service}
                        {d.service.toLowerCase().includes('sapling') && (
                          <span className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                            Most Accurate
                          </span>
                        )}
                      </span>
                      <span className={`font-bold ${getColor(d.score)}`}>
                        {d.score >= 0 ? `${d.score}% — ${d.label}` : 'Error'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-black/30 rounded-full h-3 mb-1 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-1000 ${getBarColor(d.score)}`}
                        style={{ width: `${Math.max(0, d.score)}%` }}
                      />
                    </div>
                    {d.reasoning && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-3 bg-gray-50 dark:bg-transparent p-2 rounded">
                        {d.reasoning}
                      </p>
                    )}
                    {d.error && (
                      <p className="text-xs text-red-500 mt-2 font-medium">Could not reach {d.service}</p>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-gray-400 text-center border-t border-gray-100 dark:border-white/10 pt-4 uppercase tracking-widest">
                AI detection is not 100% accurate. Use as a guide only.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}