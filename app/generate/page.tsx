'use client'
import ReactMarkdown from 'react-markdown'
import { useState } from 'react'
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

export default function GeneratePage() {
  const [subject, setSubject] = useState('')
  const [taskType, setTaskType] = useState('')
  const [prompt, setPrompt] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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
          <a href="/generate" className="font-medium text-blue-600">Generate</a>
          <a href="/ai-check" className="text-gray-900 hover:text-blue-600">AI Check</a>
          <a href="/humanize" className="text-gray-900 hover:text-blue-600">Humanize</a>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">Logout</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6 space-y-4">
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
          placeholder="Describe your task in detail. E.g. 'Write an outline for a TOK essay on the title: Is certainty attainable?'"
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