'use client'
import ReactMarkdown from 'react-markdown'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

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

  const handleHumanize = async () => {
    if (!text) return
    setLoading(true)
    setError('')
    setOutput('')

    try {
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
            const delta = parsed.choices?.[0]?.delta?.content || ''
            setOutput(prev => prev + delta)
          } catch {}
        }
      }
    } catch (err) {
      setError('Connection failed.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 dark:bg-[#0f172a] dark:text-slate-100 transition-colors duration-300">
      
      {/* --- MATCHED NAVBAR --- */}
      <nav className="w-full bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Placeholder to match the sidebar toggle button spacing from Generate page */}
            <div className="p-2 text-transparent select-none">⇠</div>
            <Link href="/home" className="text-xl font-bold text-blue-600 dark:text-white" style={{ fontFamily: 'Georgia, serif' }}>
              IB Study Tools
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl p-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
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

          <button 
            onClick={handleLogout}
            className="text-sm font-bold text-slate-400 hover:text-red-500 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* --- PAGE CONTENT --- */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 pt-12 space-y-8">
          
          <header className="space-y-2">
            <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Humanize</h2>
            <p className="text-slate-500 dark:text-slate-400 text-base font-medium">
              Rewrite AI text to sound natural while keeping the meaning.
            </p>
          </header>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 p-4 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Input Area */}
          <div className="relative group">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your AI-generated text here..."
              className="w-full border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 h-56 resize-none text-base bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          {/* Style Selector */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {STYLES.map(s => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  style === s.id
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300'
                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs mb-1 uppercase tracking-tight">{s.label}</div>
                <div className="text-[10px] leading-tight opacity-70">{s.description}</div>
              </button>
            ))}
          </div>

          <button
            onClick={handleHumanize}
            disabled={loading || !text}
            className="w-full bg-slate-900 dark:bg-blue-600 text-white rounded-2xl py-5 font-bold hover:opacity-90 transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-[0.98]"
          >
            {loading ? 'Rewriting text...' : 'Humanize Text'}
          </button>

          {/* Output Area */}
          {output && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl shadow-slate-100/50 dark:shadow-none">
              <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rewritten Result</span>
                <button 
                  onClick={copyToClipboard}
                  className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs px-4 py-2 rounded-xl font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                >
                  Copy Text
                </button>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 prose-p:leading-relaxed">
                <ReactMarkdown>{output}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}