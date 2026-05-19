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
]

const TASK_TYPES = [
  'Essay', 'IA Idea', 'Outline', 'Study Notes',
  'Revision Summary', 'Explanation', 'Practice Questions',
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
  const bottomRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadHistory() }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
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
  }

  const loadGeneration = (gen: Generation) => {
    setSubject(gen.subject || '')
    setTaskType(gen.task_type || '')
    setMessages([
      { role: 'user', content: gen.input },
      { role: 'assistant', content: gen.output },
    ])
    setStarted(true)
    setError('')
    setMenuOpen(null)
  }

  const handlePin = async (gen: Generation) => {
    setMenuOpen(null)
    const pinned = !gen.metadata?.pinned
    await supabase
      .from('generations')
      .update({ metadata: { ...gen.metadata, pinned } })
      .eq('id', gen.id)
    loadHistory()
  }

  const handleDelete = async (id: string) => {
    setMenuOpen(null)
    if (!confirm('Delete this chat? This cannot be undone.')) return
    await supabase.from('generations').delete().eq('id', id)
    loadHistory()
  }

  const startRename = (gen: Generation) => {
    setMenuOpen(null)
    setRenamingId(gen.id)
    setRenameValue(gen.metadata?.label || `${gen.subject} — ${gen.task_type}`)
  }

  const handleRename = async (id: string, currentMetadata: any) => {
    if (!renameValue.trim()) return
    await supabase
      .from('generations')
      .update({ metadata: { ...currentMetadata, label: renameValue.trim() } })
      .eq('id', id)
    setRenamingId(null)
    loadHistory()
  }

  const handleSend = async () => {
    if (!input.trim()) return
    if (!started && (!subject || !taskType)) {
      setError('Please select a subject and task type first')
      return
    }

    const userMessage: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError('')
    setStarted(true)

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject,
        taskType,
        prompt: input,
        messages: newMessages,
      }),
    })

    if (!res.ok) {
      setError(await res.text())
      setLoading(false)
      return
    }

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let fullOutput = ''

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
      await supabase.from('generations').insert({
        user_id: user.id,
        tool: 'generate',
        subject,
        task_type: taskType,
        input,
        output: fullOutput,
      })
      loadHistory()
    }

    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    // NEW: Applied deep blue gradient background and white text globally
    <div className="min-h-screen flex flex-col text-white bg-gradient-to-br from-[#15284c] to-[#0a1128]">
      {/* NEW: Navbar is now transparent with white borders/text */}
      <nav className="border-b border-white/10 px-6 py-4 flex justify-between items-center bg-black/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-300 hover:text-white text-xl"
          >
            ☰
          </button>
          <h1 className="font-bold text-lg text-white" style={{ fontFamily: 'Georgia, serif' }}>
            IB Study Tools
          </h1>
        </div>
        <div className="flex gap-4 text-sm">
          <a href="/home" className="text-gray-300 hover:text-white transition">Home</a>
          <a href="/generate" className="font-medium text-white">Generate</a>
          <a href="/ai-check" className="text-gray-300 hover:text-white transition">AI Check</a>
          <a href="/humanize" className="text-gray-300 hover:text-white transition">Humanize</a>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-200 transition">Logout</button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 65px)' }}>

        {/* Sidebar */}
        {/* NEW: Sidebar uses glassmorphism (translucent dark bg) instead of solid white */}
        {sidebarOpen && (
          <div className="w-64 border-r border-white/10 flex flex-col shrink-0 bg-black/20">
            <div className="p-3 border-b border-white/10">
              <button
                onClick={handleNew}
                className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition"
              >
                + New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {history.length === 0 && (
                <p className="text-xs text-gray-400 p-4">No history yet</p>
              )}
              {history.map(gen => (
                <div key={gen.id} className="relative border-b border-white/5 group">

                  {renamingId === gen.id ? (
                    <div className="p-2">
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRename(gen.id, gen.metadata)
                          if (e.key === 'Escape') setRenamingId(null)
                        }}
                        className="w-full border border-white/20 bg-white/10 rounded p-1 text-xs text-white placeholder-gray-400"
                      />
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => handleRename(gen.id, gen.metadata)}
                          className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setRenamingId(null)}
                          className="text-xs text-gray-300 px-2 py-0.5 rounded border border-white/20 hover:bg-white/5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* NEW: Adjusted hover states for dark mode */}
                      <button
                        onClick={() => loadGeneration(gen)}
                        className="w-full text-left p-3 hover:bg-white/5 text-xs pr-8 transition"
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          {gen.metadata?.pinned && (
                            <span className="text-blue-400 text-xs">📌</span>
                          )}
                          <p className="font-medium text-gray-200 truncate">
                            {gen.metadata?.label || `${gen.subject} — ${gen.task_type}`}
                          </p>
                        </div>
                        <p className="text-gray-400 truncate">{gen.input}</p>
                        <p className="text-gray-500 mt-0.5">
                          {new Date(gen.created_at).toLocaleDateString()}
                        </p>
                      </button>

                      <button
                        onMouseDown={e => {
                          e.stopPropagation()
                          e.preventDefault()
                          setMenuOpen(menuOpen === gen.id ? null : gen.id)
                        }}
                        className="absolute right-1 top-2.5 w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition"
                      >
                        ···
                      </button>

                      {menuOpen === gen.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-9 z-50 bg-[#1e293b] border border-white/10 rounded-xl shadow-xl w-40 overflow-hidden"
                          onMouseDown={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handlePin(gen)}
                            className="w-full text-left px-3 py-2.5 hover:bg-white/5 text-gray-200 text-xs flex items-center gap-2"
                          >
                            <span>📌</span>
                            <span>{gen.metadata?.pinned ? 'Unpin' : 'Pin'}</span>
                          </button>
                          <button
                            onClick={() => startRename(gen)}
                            className="w-full text-left px-3 py-2.5 hover:bg-white/5 text-gray-200 text-xs flex items-center gap-2"
                          >
                            <span>✏️</span>
                            <span>Rename</span>
                          </button>
                          <div className="border-t border-white/10 my-1" />
                          <button
                            onClick={() => handleDelete(gen.id)}
                            className="w-full text-left px-3 py-2.5 hover:bg-red-500/10 text-red-400 text-xs flex items-center gap-2"
                          >
                            <span>🗑️</span>
                            <span>Delete</span>
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

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!started && (
            <div className="p-6 border-b border-white/10 bg-black/10">
              <p className="text-sm text-gray-300 mb-3">Select your subject and task type to get started:</p>
              <div className="flex gap-3">
                {/* NEW: Styled dropdowns for dark theme */}
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="flex-1 border border-white/20 rounded-lg p-2 text-sm bg-[#0f172a] text-white focus:outline-none focus:border-blue-500">
                  <option value="">Select subject...</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={taskType} onChange={e => setTaskType(e.target.value)}
                  className="flex-1 border border-white/20 rounded-lg p-2 text-sm bg-[#0f172a] text-white focus:outline-none focus:border-blue-500">
                  <option value="">Select task type...</option>
                  {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </div>
          )}

          {started && (
            <div className="px-4 py-2 border-b border-white/10 bg-black/10 flex items-center gap-2 text-xs text-gray-300">
              <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">{subject}</span>
              <span className="bg-white/10 text-gray-300 px-2 py-0.5 rounded border border-white/10">{taskType}</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-20">
                <p className="text-lg mb-2 text-white">👋 Hi! I'm your IB tutor.</p>
                <p className="text-sm">Select a subject and task type, then ask me anything.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {/* NEW: Chat bubbles adapted for dark mode */}
                <div className={`max-w-2xl rounded-2xl px-5 py-4 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white text-sm'
                    : 'bg-[#1e293b] border border-white/10 text-gray-100 text-sm leading-relaxed shadow-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none text-gray-200 prose-headings:text-white prose-headings:font-semibold prose-p:leading-relaxed prose-li:leading-relaxed prose-table:text-sm prose-strong:text-white">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1e293b] border border-white/10 rounded-2xl px-4 py-3 text-sm text-gray-400 shadow-sm animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* NEW: Input area styled for dark theme */}
          <div className="p-4 border-t border-white/10 bg-black/10 backdrop-blur-md">
            <div className="flex gap-3 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your IB tutor anything... (Enter to send, Shift+Enter for new line)"
                className="flex-1 border border-white/20 rounded-xl p-3 text-sm bg-white/5 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 transition"
                rows={2}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-blue-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shrink-0 transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}