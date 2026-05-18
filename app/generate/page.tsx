'use client'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { useState, useEffect } from 'react'
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
  const [prompt, setPrompt] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<Generation[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadHistory()
  }, [])

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
    setPrompt('')
    setOutput('')
    setError('')
  }

  const loadGeneration = (gen: Generation) => {
    setSubject(gen.subject || '')
    setTaskType(gen.task_type || '')
    setPrompt(gen.input)
    setOutput(gen.output)
    setError('')
  }

  const handleGenerate = async () => {
    if (!subject || !taskType || !prompt) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    setOutput('')

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, taskType, prompt }),
    })

    if (!res.ok) {
      setError(await res.text())
      setLoading(false)
      return
    }

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let fullOutput = ''

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
          setOutput(prev => prev + text)
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
        input: prompt,
        output: fullOutput,
      })
      loadHistory()
    }

    setLoading(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-900 text-xl font-bold"
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

      <div className="flex flex-1">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-64 bg-white border-r flex flex-col shrink-0">
            <div className="p-3 border-b">
              <button
                onClick={handleNew}
                className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700"
              >
                + New
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

        {/* Main content */}
        <div className="flex-1 max-w-3xl mx-auto p-6 space-y-4 w-full">
          <h2 className="text-xl font-bold text-gray-900">Generate</h2>
          <p className="text-gray-700 text-sm">AI-powered IB tutor for essays, notes, IA ideas and more.</p>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
          )}

          <select value={subject} onChange={e => setSubject(e.target.value)}
            className="w-full border rounded-lg p-3 text-sm bg-white text-gray-900">
            <option value="">Select subject...</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={taskType} onChange={e => setTaskType(e.target.value)}
            className="w-full border rounded-lg p-3 text-sm bg-white text-gray-900">
            <option value="">Select task type...</option>
            {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe your task in detail."
            className="w-full border rounded-lg p-3 h-36 resize-none text-sm text-gray-900 placeholder-gray-400"
          />
          <p className="text-xs text-gray-400 text-right">{prompt.length}/2000</p>

          <button onClick={handleGenerate} disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Generating...' : 'Generate'}
          </button>

          {output && (
            <div className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-900">Result</span>
                <button onClick={copyToClipboard} className="text-xs text-blue-600 hover:underline">
                  Copy
                </button>
              </div>
              <div className="prose prose-sm max-w-none text-gray-900">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {output}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}