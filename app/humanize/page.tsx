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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="font-bold text-lg text-blue-600">IB Study Tools</h1>
        <div className="flex gap-4 text-sm">
        <a href="/home" className="text-gray-900 hover:text-blue-600">Home</a>
          <a href="/generate" className="text-gray-900 hover:text-blue-600">Generate</a>
          <a href="/ai-check" className="text-gray-900 hover:text-blue-600">AI Check</a>
          <a href="/humanize" className="font-medium text-blue-600">Humanize</a>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">Logout</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Humanize</h2>
        <p className="text-gray-700 text-sm">Rewrite AI text to sound natural while keeping the meaning.</p>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
        )}

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste your AI-generated text here..."
          className="w-full border rounded-lg p-3 h-48 resize-none text-sm text-gray-900 placeholder-gray-400"
        />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={`p-3 rounded-lg border text-left text-xs transition-all ${
                style === s.id
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
              }`}
            >
              <div className="font-medium mb-1">{s.label}</div>
              <div className="text-gray-500 text-xs">{s.description}</div>
            </button>
          ))}
        </div>

        <button onClick={handleHumanize} disabled={loading || !text}
          className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Rewriting...' : 'Humanize'}
        </button>

        {output && (
          <div className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-900">Rewritten</span>
              <button onClick={copyToClipboard}
                className="text-xs text-blue-600 hover:underline">
                Copy
              </button>
            </div>
            <div className="prose prose-sm max-w-none text-gray-900">
              <ReactMarkdown>{output}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}