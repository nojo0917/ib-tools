'use client'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const SUBJECTS = [
  'Mathematics AA', 'Mathematics AI',
  'Chemistry', 'Biology', 'Physics',
  'English Language & Literature', 'English Literature',
  'History', 'Economics', 'Psychology',
  'Global Politics',
  'Theory of Knowledge (TOK)',
  'Extended Essay (EE)',
  'Computer Science',
  'General Chat',
]

const TASK_TYPES = [
  'Essay', 'IA Idea', 'Outline', 'Study Notes',
  'Revision Summary', 'Explanation', 'Practice Questions', 'Normal Chatting',
]

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Generation {
  id: string
  subject: string
  task_type: string
  input: string
  output: string
  created_at: string
  metadata?: {
    pinned?: boolean
    label?: string
  }
}

export default function GeneratePage() {
  const [subject, setSubject] = useState('')
  const [taskType, setTaskType] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<Generation[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [started, setStarted] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadHistory() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const loadHistory = async () => {
    const { data } = await supabase
      .from('generations')
      .select('*')
      .eq('tool', 'generate')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) {
      const sorted = [...data].sort((a, b) => {
        const aPinned = a.metadata?.pinned ? 1 : 0
        const bPinned = b.metadata?.pinned ? 1 : 0
        return bPinned - aPinned
      })
      setHistory(sorted)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleNew = () => {
    setSubject('')
    setTaskType('')
    setMessages([])
    setInput('')
    setError('')
    setStarted(false)
    setMenuOpen(null)
    setCurrentChatId(null)
  }

  const loadGeneration = (gen: Generation) => {
    setSubject(gen.subject || '')
    setTaskType(gen.task_type || '')
    setCurrentChatId(gen.id)
    try {
      const parsedHistory = JSON.parse(gen.output)
      setMessages(Array.isArray(parsedHistory) ? parsedHistory : [
        { role: 'user', content: gen.input },
        { role: 'assistant', content: gen.output },
      ])
    } catch {
      setMessages([
        { role: 'user', content: gen.input },
        { role: 'assistant', content: gen.output },
      ])
    }
    setStarted(true)
    setError('')
    setMenuOpen(null)
  }

  const handlePin = async (gen: Generation) => {
    setMenuOpen(null)
    const pinned = !gen.metadata?.pinned
    await supabase.from('generations').update({ metadata: { ...gen.metadata, pinned } }).eq('id', gen.id)
    loadHistory()
  }

  const handleDelete = async (id: string) => {
    setMenuOpen(null)
    if (!confirm('Delete this chat? This cannot be undone.')) return
    await supabase.from('generations').delete().eq('id', id)
    if (currentChatId === id) handleNew()
    loadHistory()
  }

  const startRename = (gen: Generation) => {
    setMenuOpen(null)
    setRenamingId(gen.id)
    setRenameValue(gen.metadata?.label || `${gen.subject} — ${gen.task_type}`)
  }

  const handleRename = async (id: string, currentMetadata: any) => {
    if (!renameValue.trim()) return
    await supabase.from('generations').update({ metadata: { ...currentMetadata, label: renameValue.trim() } }).eq('id', id)
    setRenamingId(null)
    loadHistory()
  }

  const handleSend = async () => {
    if (!input.trim()) return
    if (!started && (!subject || !taskType)) {
      setError('Please select a subject and task type first')
      return
    }

    const currentInput = input;
    const userMessage: Message = { role: 'user', content: currentInput }
    const newMessages = [...messages, userMessage]
    
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError('')
    setStarted(true)

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, taskType, prompt: currentInput, messages: newMessages }),
    })

    if (!res.ok) {
      setError(await res.text()); setLoading(false); return
    }

    const reader = res.body?.getReader(); const decoder = new TextDecoder(); let fullOutput = ''
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

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
          fullOutput += text
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: fullOutput }
            return updated
          })
        } catch {}
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user && fullOutput) {
      const finalConversationHistory = [...newMessages, { role: 'assistant', content: fullOutput }]
      if (currentChatId) {
        await supabase.from('generations').update({ output: JSON.stringify(finalConversationHistory) }).eq('id', currentChatId)
      } else {
        const { data } = await supabase.from('generations').insert({
          user_id: user.id, tool: 'generate', subject, task_type: taskType, input: currentInput,
          output: JSON.stringify(finalConversationHistory),
        }).select().single()
        if (data) setCurrentChatId(data.id)
      }
      loadHistory()
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 dark:text-white dark:bg-gradient-to-br dark:from-[#15284c] dark:to-[#0a1128]">
      
      {/* Navbar Adaptive */}
      <nav className="border-b border-gray-200 dark:border-white/10 px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-black/10 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white text-xl">
            ☰
          </button>
          <h1 className="font-bold text-lg text-blue-600 dark:text-white" style={{ fontFamily: 'Georgia, serif' }}>
            IB Study Tools
          </h1>
        </div>
        <div className="flex gap-4 text-sm font-medium">
          <a href="/home" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition">Home</a>
          <a href="/generate" className="text-blue-600 dark:text-white border-b-2 border-blue-600 dark:border-white pb-1">Generate</a>
          <a href="/ai-check" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition">AI Check</a>
          <a href="/humanize" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition">Humanize</a>
          {/* NEW: Past Papers Link */}
          <a href="/past-papers" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition">Past Papers</a>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition">Logout</button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 65px)' }}>

        {/* Sidebar Adaptive */}
        {sidebarOpen && (
          <div className="w-64 border-r border-gray-200 dark:border-white/10 flex flex-col shrink-0 bg-gray-50 dark:bg-black/20">
            <div className="p-3 border-b border-gray-200 dark:border-white/10">
              <button onClick={handleNew} className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-blue-700 transition shadow-sm">
                + New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {history.length === 0 && <p className="text-xs text-gray-400 p-4">No history yet</p>}
              {history.map(gen => (
                <div key={gen.id} className="relative border-b border-gray-100 dark:border-white/5 group">
                  {renamingId === gen.id ? (
                    <div className="p-2 bg-white dark:bg-white/5">
                      <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(gen.id, gen.metadata); if (e.key === 'Escape') setRenamingId(null) }}
                        className="w-full border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 rounded p-1 text-xs text-gray-900 dark:text-white"
                      />
                    </div>
                  ) : (
                    <>
                      <button onClick={() => loadGeneration(gen)}
                        className={`w-full text-left p-3 hover:bg-white dark:hover:bg-white/5 text-xs pr-8 transition ${currentChatId === gen.id ? 'bg-white dark:bg-white/5 border-l-4 border-blue-600' : ''}`}>
                        <div className="flex items-center gap-1 mb-0.5 font-bold text-gray-800 dark:text-gray-200">
                          {gen.metadata?.pinned && <span className="text-blue-500 text-xs">📌</span>}
                          <p className="truncate">{gen.metadata?.label || `${gen.subject} — ${gen.task_type}`}</p>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 truncate">{gen.input}</p>
                      </button>
                      <button onMouseDown={e => { e.stopPropagation(); e.preventDefault(); setMenuOpen(menuOpen === gen.id ? null : gen.id) }}
                        className="absolute right-1 top-2.5 w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition">···</button>
                      {menuOpen === gen.id && (
                        <div ref={menuRef} className="absolute right-0 top-9 z-50 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl w-40 overflow-hidden">
                          <button onClick={() => handlePin(gen)} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 text-xs flex items-center gap-2">
                            <span>📌</span> {gen.metadata?.pinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button onClick={() => startRename(gen)} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 text-xs flex items-center gap-2">
                            <span>✏️</span> Rename
                          </button>
                          <button onClick={() => handleDelete(gen.id)} className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 border-t border-gray-100 dark:border-white/10">
                            <span>🗑️</span> Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Area Adaptive */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-transparent">
          {!started && (
            <div className="p-6 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-black/10">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Setup your session:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="w-full border border-gray-300 dark:border-white/20 rounded-xl p-3 text-sm bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition">
                  <option value="">Select subject...</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={taskType} onChange={e => setTaskType(e.target.value)}
                  className="w-full border border-gray-300 dark:border-white/20 rounded-xl p-3 text-sm bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition">
                  <option value="">Select task type...</option>
                  {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {error && <p className="text-red-500 text-xs mt-3 font-medium">{error}</p>}
            </div>
          )}

          {started && (
            <div className="px-4 py-2 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-black/10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-500/30">{subject}</span>
              <span className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10">{taskType}</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center mt-20 space-y-3">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">👋 Hi! I'm your IB tutor.</p>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Select a subject and task type above, then we can start building your essay, outline, or notes.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-2xl rounded-2xl px-5 py-4 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 leading-relaxed'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none text-inherit dark:prose-invert prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:text-white">
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm text-gray-500 dark:text-gray-400 shadow-sm animate-pulse">
                  Tutor is thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Area Adaptive */}
          <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-black/10 backdrop-blur-md">
            <div className="max-w-4xl mx-auto flex gap-3 items-end">
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Ask your IB tutor anything..."
                className="flex-1 border border-gray-300 dark:border-white/20 rounded-2xl p-4 text-sm bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500/50 outline-none transition"
                rows={2}
              />
              <button onClick={handleSend} disabled={loading || !input.trim()}
                className="bg-blue-600 text-white rounded-2xl px-6 py-4 text-sm font-bold hover:bg-blue-700 disabled:opacity-50 shrink-0 transition-all shadow-lg active:scale-95">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}