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
  const [selectedStyle, setSelectedStyle] = useState('Standard')

  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const navLinks = [
    { name: 'Home', href: '/home' },
    { name: 'AI Tutor', href: '/generate' },
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
    setResult('')

    try {
      const res = await fetch('/api/ai-polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, style: selectedStyle }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        // We use data.output because your route.ts sends errors in that field
        throw new Error(data.output || 'Failed to polish text')
      }
      
      setResult(data.output)
    } catch (err: any) {
      // This will now catch the ACTUAL error message from the API (like "Invalid API Key")
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 dark:bg-[#0f172a] dark:text-slate-100 transition-colors duration-300">
      
      {/* --- NAVBAR --- */}
      <nav className="w-full bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-14 shrink-0" aria-hidden="true" />
            <Link href="/home">
              <span 
                className="text-xl font-bold text-blue-600 dark:text-white" 
                style={{ fontFamily: 'Georgia, serif' }}
              >
                IB Study Tools
              </span>
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
      <main className="flex-1 max-w-5xl mx-auto w-full p-6 pt-12 space-y-8">
        <header className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">AI Polish</h2>
          <p className="text-slate-500 dark:text-slate-400 text-base font-medium">
            Refine your grammar and flow while keeping your original voice.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Original Draft</label>
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-100 dark:border-slate-800">
                {styles.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedStyle(s)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                      selectedStyle === s 
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your text here (minimum 20 characters)..."
                className="w-full h-96 p-6 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all resize-none text-sm leading-relaxed shadow-sm"
              />
              <div className="absolute bottom-6 right-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {text.length} characters
              </div>
            </div>

            <button
              onClick={handlePolish}
              disabled={loading || text.length < 20}
              className="w-full py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 dark:shadow-none active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Polishing...
                </span>
              ) : 'Improve Writing'}
            </button>
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Polished Version</label>
            <div className={`w-full h-96 p-8 rounded-[2.5rem] border-2 transition-all duration-500 ${
              result 
                ? 'border-blue-100 dark:border-blue-900/30 bg-white dark:bg-slate-900 shadow-2xl shadow-blue-500/5' 
                : 'border-slate-100 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-900/20'
            }`}>
              <div className="h-full overflow-y-auto custom-scrollbar">
                {result ? (
                  <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {result}
                  </p>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">✨</div>
                    <p className="text-sm text-slate-400 italic font-medium">Your improved text will appear here...</p>
                  </div>
                )}
              </div>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl">
                <p className="text-red-600 dark:text-red-400 text-xs font-bold text-center">
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}