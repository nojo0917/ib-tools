'use client'
import ReactMarkdown from 'react-markdown'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const STYLES = [
  { id: 'natural', label: 'Natural', description: 'Sounds human and conversational' },
  { id: 'academic', label: 'Academic', description: 'Polished IB essay style' },
  { id: 'concise', label: 'Concise', description: 'Shorter, no filler words' },
  { id: 'student', label: 'Student Tone', description: 'Genuine high-achieving student voice' },
  { id: 'formal', label: 'Formal', description: 'Professional and measured' },
]

export default function HumanizePage() {
  const [text, setText] = useState('')
  const [style, setStyle] = useState('natural')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleHumanize = async () => {
    if (!text) return
    setLoading(true)
    setError('')
    setOutput('')

    const res = await fetch('/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, style }),
    })

    if (!res.ok) {
      setError(await res.text())
      setLoading(false)
      return
    }

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()

    while (reader) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '))
      for (const line of lines) {
        const data = line.replace('data: ', '')
        if (data === '[DONE]') break
        try {
          const parsed = JSON.parse(data)
          const text = parsed.choices?.[0]?.delta?.content || ''
          setOutput(prev => prev + text)
        } catch {}
      }
    }
    setLoading(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
  }

  return (
    // NEW: Deep blue gradient background
    <div className="min-h-screen flex flex-col text-gray-900 bg-gray-50 dark:text-white dark:bg-gradient-to-br dark:from-[#15284c] dark:to-[#0a1128]">
      {/* NEW: Transparent, glassmorphism navbar */}
      <nav className="border-b border-white/10 px-6 py-4 flex justify-between items-center bg-black/10 backdrop-blur-sm">
        <h1 className="font-bold text-lg text-white" style={{ fontFamily: 'Georgia, serif' }}>
          IB Study Tools
        </h1>
        <div className="flex gap-4 text-sm">
          <a href="/home" className="text-gray-300 hover:text-white transition">Home</a>
          <a href="/generate" className="text-gray-300 hover:text-white transition">Generate</a>
          <a href="/ai-check" className="text-gray-300 hover:text-white transition">AI Check</a>
          <a href="/humanize" className="font-medium text-white">Humanize</a>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-200 transition">Logout</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Humanize</h2>
        <p className="text-gray-300 text-sm">Rewrite AI text to sound natural while keeping the meaning.</p>

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
          placeholder="Paste your AI-generated text here..."
          className="w-full border border-white/20 bg-white/5 rounded-lg p-3 h-48 resize-none text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
        />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={`p-3 rounded-lg border text-left text-xs transition-all ${
                style === s.id
                  // NEW: Selected state is translucent blue
                  ? 'border-blue-400 bg-blue-500/20 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                  // NEW: Unselected state is glassmorphism
                  : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30 hover:bg-white/10'
              }`}
            >
              <div className={`font-medium mb-1 ${style === s.id ? 'text-white' : 'text-gray-200'}`}>
                {s.label}
              </div>
              <div className={style === s.id ? 'text-blue-200/80' : 'text-gray-400'}>
                {s.description}
              </div>
            </button>
          ))}
        </div>

        <button onClick={handleHumanize} disabled={loading || !text}
          className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 disabled:opacity-50 transition">
          {loading ? 'Rewriting...' : 'Humanize'}
        </button>

        {output && (
          // NEW: Glassmorphism output box
          <div className="bg-[#1e293b]/80 border border-white/10 backdrop-blur-md rounded-lg p-5 shadow-xl mt-6">
            <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-3">
              <span className="text-sm font-medium text-gray-200">Rewritten Text</span>
              <button onClick={copyToClipboard}
                className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition">
                Copy
              </button>
            </div>
            {/* NEW: Markdown prose styling adapted for dark text */}
            <div className="prose prose-sm max-w-none text-gray-200 prose-headings:text-white prose-strong:text-white prose-p:leading-relaxed">
              <ReactMarkdown>{output}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}