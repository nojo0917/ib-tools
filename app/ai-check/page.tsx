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

  // NEW: Adjusted colors to look better on a dark background
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
    // NEW: Deep blue gradient background
    <div className="min-h-screen text-white bg-gradient-to-br from-[#15284c] to-[#0a1128]">
      {/* NEW: Transparent, glassmorphism navbar */}
      <nav className="border-b border-white/10 px-6 py-4 flex justify-between items-center bg-black/10 backdrop-blur-sm">
        <h1 className="font-bold text-lg text-white" style={{ fontFamily: 'Georgia, serif' }}>
          IB Study Tools
        </h1>
        <div className="flex gap-4 text-sm">
          <a href="/home" className="text-gray-300 hover:text-white transition">Home</a>
          <a href="/generate" className="text-gray-300 hover:text-white transition">Generate</a>
          <a href="/ai-check" className="font-medium text-white">AI Check</a>
          <a href="/humanize" className="text-gray-300 hover:text-white transition">Humanize</a>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-200 transition">Logout</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">AI Check</h2>
        <p className="text-gray-300 text-sm">Paste text to check if it was AI-generated.</p>

        {error && (
          // NEW: Dark mode styled error box
          <div className="bg-red-500/20 border border-red-500/30 text-red-200 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* NEW: Glassmorphism textarea */}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste your text here (minimum 50 characters)..."
          className="w-full border border-white/20 bg-white/5 rounded-lg p-3 h-48 resize-none text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
        />
        <p className="text-xs text-gray-400 text-right">{text.length}/5000</p>

        <button onClick={handleCheck} disabled={loading || text.length < 50}
          className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 disabled:opacity-50 transition">
          {loading ? 'Analysing...' : 'Analyse Text'}
        </button>

        {results && (
          // NEW: Glassmorphism results card
          <div className="bg-[#1e293b]/80 border border-white/10 backdrop-blur-md rounded-lg p-6 space-y-6 shadow-xl">
            <div className="text-center">
              <p className="text-sm text-gray-300 mb-1">Average AI Probability</p>
              <p className={`text-4xl font-bold ${getColor(results.average)}`}>
                {results.average}%
              </p>
              <p className={`text-sm font-medium mt-1 ${getColor(results.average)}`}>
                {results.averageLabel}
              </p>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-4">
              {results.detectors.map((d: any) => (
                <div key={d.service}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-200">{d.service}</span>
                    <span className={getColor(d.score)}>{d.score}% — {d.label}</span>
                  </div>
                  {/* NEW: Darker track for the progress bar */}
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getBarColor(d.score)}`}
                      style={{ width: `${d.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 text-center">
              AI detection is not 100% accurate. Use as a guide only.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}