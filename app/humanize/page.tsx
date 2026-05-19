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
    <div className="min-h-screen flex flex-col text-gray-900 bg-white dark:text-white dark:bg-gradient-to-br dark:from-[#15284c] dark:to-[#0a1128]">
      
      {/* Adaptive Navbar */}
      <nav className="border-b border-gray-200 dark:border-white/10 px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-black/10 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="font-bold text-lg text-blue-600 dark:text-white" style={{ fontFamily: 'Georgia, serif' }}>
          IB Study Tools
        </h1>
        <div className="flex gap-4 text-sm font-medium">
          <a href="/home" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition">Home</a>
          <a href="/generate" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition">Generate</a>
          <a href="/ai-check" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition">AI Check</a>
          <a href="/humanize" className="text-blue-600 dark:text-white border-b-2 border-blue-600 dark:border-white pb-1">Humanize</a>
          {/* NEW: Past Papers Link */}
          <a href="/past-papers" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition">Past Papers</a>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition">Logout</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Humanize</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            Rewrite AI text to sound natural while keeping the meaning.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-200 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Adaptive Textarea */}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste your AI-generated text here..."
          className="w-full border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 rounded-2xl p-5 h-56 resize-none text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
        />

        {/* Style Selector Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                style === s.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/30 hover:bg-gray-50 dark:hover:bg-white/10'
              }`}
            >
              <div className={`font-bold text-xs mb-1 ${style === s.id ? 'text-blue-700 dark:text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                {s.label}
              </div>
              <div className={`text-[10px] leading-tight ${style === s.id ? 'text-blue-600/80 dark:text-blue-200/80' : 'text-gray-500 dark:text-gray-400'}`}>
                {s.description}
              </div>
            </button>
          ))}
        </div>

        <button 
          onClick={handleHumanize} 
          disabled={loading || !text}
          className="w-full bg-blue-600 text-white rounded-xl py-4 font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg active:scale-[0.98]"
        >
          {loading ? 'Rewriting...' : 'Humanize Text'}
        </button>

        {output && (
          <div className="bg-white dark:bg-[#1e293b]/80 border border-gray-200 dark:border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl mt-6">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-white/10 pb-4">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Rewritten Result</span>
              <button 
                onClick={copyToClipboard}
                className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-blue-200 dark:hover:bg-blue-500/30 transition"
              >
                Copy Text
              </button>
            </div>
            {/* Markdown adaptive styling */}
            <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200 prose-headings:text-gray-900 dark:prose-headings:text-white prose-strong:text-gray-900 dark:prose-strong:text-white prose-p:leading-relaxed">
              <ReactMarkdown>{output}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}