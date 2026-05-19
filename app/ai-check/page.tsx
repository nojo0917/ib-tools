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
    if (score > 70) return 'text-red-400'
    if (score > 40) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getBarColor = (score: number) => {
    if (score > 70) return 'bg-red-500'
    if (score > 40) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="min-h-screen flex flex-col text-white bg-gradient-to-br from-[#15284c] to-[#0a1128]">
      
      <nav className="border-b border-white/10 px-6 py-4 flex justify-between items-center bg-black/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-lg text-white" style={{ fontFamily: 'Georgia, serif' }}>
            IB Study Tools
          </h1>
        </div>
        <div className="flex gap-4 text-sm">
          <a href="/home" className="text-gray-300 hover:text-white transition">Home</a>
          <a href="/generate" className="text-gray-300 hover:text-white transition">Generate</a>
          <a href="/ai-check" className="font-medium text-white">AI Check</a>
          <a href="/humanize" className="text-gray-300 hover:text-white transition">Humanize</a>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-200 transition">Logout</button>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6 mt-4">
          
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">AI Check</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Paste text to check if it was AI-generated. Results come from two independent detectors.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-200 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your text here (minimum 50 characters)..."
              className="w-full border border-white/20 rounded-xl p-4 h-56 resize-none text-sm bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
            />
            <p className="absolute bottom-3 right-4 text-xs text-gray-400">{text.length}/5000</p>
          </div>

          <button
            onClick={handleCheck}
            disabled={loading || text.length < 50}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 disabled:opacity-50 transition shadow-lg"
          >
            {loading ? 'Analysing...' : 'Analyse Text'}
          </button>

          {loading && (
            <div className="bg-[#1e293b] border border-white/10 rounded-xl p-6 text-center shadow-lg animate-pulse">
              <p className="text-sm text-gray-400">Running detection — this may take a few seconds...</p>
            </div>
          )}

          {results && (
            <div className="bg-[#1e293b] border border-white/10 rounded-xl p-6 space-y-6 shadow-xl">
              {/* Average score */}
              <div className="text-center bg-black/20 rounded-lg p-6 border border-white/5">
                <p className="text-sm text-gray-300 mb-2">Combined AI Probability</p>
                <p className={`text-5xl font-bold ${getColor(results.average)}`}>
                  {results.average}%
                </p>
                <p className={`text-sm font-medium mt-2 ${getColor(results.average)}`}>
                  {results.averageLabel}
                </p>
              </div>

              {/* Individual detectors */}
              <div className="border-t border-white/10 pt-6 space-y-6">
                {results.detectors.map((d: any) => (
                  <div key={d.service}>
                    <div className="flex justify-between items-end text-sm mb-2">
                      <span className="font-medium text-gray-200 flex items-center gap-2">
                        {d.service}
                        {d.service.toLowerCase().includes('sapling') && (
                          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                            Most Accurate
                          </span>
                        )}
                      </span>
                      <span className={`font-semibold ${getColor(d.score)}`}>
                        {d.score >= 0 ? `${d.score}% — ${d.label}` : 'Error'}
                      </span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-2 mb-1 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ${getBarColor(d.score)}`}
                        style={{ width: `${Math.max(0, d.score)}%` }}
                      />
                    </div>
                    {d.reasoning && (
                      <p className="text-xs text-gray-400 italic mt-2">{d.reasoning}</p>
                    )}
                    {d.error && (
                      <p className="text-xs text-red-400 mt-2">Could not reach {d.service}</p>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 text-center border-t border-white/10 pt-4">
                AI detection is not 100% accurate. Use as a guide only.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}