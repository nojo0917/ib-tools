'use client'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
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
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadHistory = async () => {
    const { data } = await supabase
      .from('generations')
      .select('*')
      .eq('tool', 'generate')
      .order('created_at', { ascending: false })
      .limit(30)
    if (data) setHistory(data)
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-900 text-xl"
          >
            ☰
          </button>
          <h1 className="font-bold text-lg text-blue-600" style={{ fontFamily: 'Georgia, serif' }}>IB Study Tools</h1>
        </div>
        <div className="flex gap-4 text-sm">
          <a href="/generate" className="font-medium text-blue-600">Generate</a>
          <a href="/ai-check" className="text-gray-900 hover:text-blue-600">AI Check</a>
          <a href="/humanize" className="text-gray-900 hover:text-blue-600">Humanize</a>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">Logout</button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 65px)' }}>
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-64 bg-white border-r flex flex-col shrink-0">
            <div className="p-3 border-b">
              <button
                onClick={handleNew}
                className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700"
              >
                + New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {history.length === 0 && (
                <p className="text-xs text-gray-400 p-4">No history yet</p>
              )}
              {history.map(gen => (
                <button
                  key={gen.id}
                  onClick={() => loadGeneration(gen)}
                  className="w-full text-left p-3 hover:bg-gray-50 border-b text-xs"
                >
                  <p className="font-medium text-gray-900 truncate">{gen.subject} — {gen.task_type}</p>
                  <p className="text-gray-500 truncate mt-0.5">{gen.input}</p>
                  <p className="text-gray-400 mt-0.5">
                    {new Date(gen.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Subject/task selectors */}
          {!started && (
            <div className="p-6 border-b bg-white">
              <p className="text-sm text-gray-700 mb-3">Select your subject and task type to get started:</p>
              <div className="flex gap-3">
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="flex-1 border rounded-lg p-2 text-sm bg-white text-gray-900">
                  <option value="">Select subject...</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={taskType} onChange={e => setTaskType(e.target.value)}
                  className="flex-1 border rounded-lg p-2 text-sm bg-white text-gray-900">
                  <option value="">Select task type...</option>
                  {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
            </div>
          )}

          {started && (
            <div className="px-4 py-2 bg-white border-b flex items-center gap-2 text-xs text-gray-500">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{subject}</span>
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{taskType}</span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-20">
                <p className="text-lg mb-2">👋 Hi! I'm your IB tutor.</p>
                <p className="text-sm">Select a subject and task type, then ask me anything.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white text-sm'
                    : 'bg-white border text-gray-900 text-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none text-gray-900">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
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
                <div className="bg-white border rounded-2xl px-4 py-3 text-sm text-gray-400">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-3 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your IB tutor anything... (Enter to send, Shift+Enter for new line)"
                className="flex-1 border rounded-xl p-3 text-sm text-gray-900 placeholder-gray-400 resize-none"
                rows={2}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-blue-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shrink-0"
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