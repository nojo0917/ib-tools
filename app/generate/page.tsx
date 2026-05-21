'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Paperclip, X, Image as ImageIcon, FileText, 
  ChevronLeft, ChevronRight, Plus, Send, StopCircle 
} from 'lucide-react'

const SUBJECTS = [
  'Mathematics AA', 'Mathematics AI', 'Chemistry', 'Biology', 'Physics',
  'English Language', 'English Literature', 'History', 'Economics', 
  'Psychology', 'Global Politics', 'Theory of Knowledge', 
  'Extended Essay', 'Computer Science', 'General Chat'
]

const TASK_TYPES = [
  'Essay', 'IA Idea', 'Outline', 'Study Notes',
  'Revision Summary', 'Explanation', 'Practice Questions', 'Normal Chat'
]

interface Message { role: 'user' | 'assistant' | 'system'; content: string }
interface Generation {
  id: string; subject: string; task_type: string; input: string;
  output: string; created_at: string; metadata?: { pinned?: boolean; label?: string }
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
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [attachedFile, setAttachedFile] = useState<{ name: string; data: string; type: string } | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
      .limit(50)
    if (data) setHistory(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleNew = () => {
    handleStop()
    setSubject(''); setTaskType(''); setMessages([]); setInput(''); 
    setError(''); setStarted(false); setCurrentChatId(null); setAttachedFile(null)
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setLoading(false)
    }
  }

  const cleanText = (text: string) => {
    return text
      .replace(/\*\*/g, '') 
      .replace(/\|/g, '')   
      .replace(/---/g, '')  
      .replace(/#/g, '')    
      .replace(/__|~~/g, '') 
      .trim();
  }

  const processFile = (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      alert("File size limit 4MB")
      return
    }
    const reader = new FileReader()
    if (file.type === "application/pdf") {
      reader.onload = (e) => setAttachedFile({ name: file.name, type: 'pdf', data: e.target?.result as string })
      reader.readAsText(file)
    } else {
      reader.onload = (e) => setAttachedFile({ name: file.name, type: 'image', data: e.target?.result as string })
      reader.readAsDataURL(file)
    }
  }

  // FIXED: Explicitly added handleFileChange function
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const loadGeneration = (gen: Generation) => {
    handleStop()
    setSubject(gen.subject || '')
    setTaskType(gen.task_type || '')
    setCurrentChatId(gen.id)
    try {
      const parsed = JSON.parse(gen.output)
      setMessages(Array.isArray(parsed) ? parsed : [{ role: 'user', content: gen.input }, { role: 'assistant', content: gen.output }])
    } catch {
      setMessages([{ role: 'user', content: gen.input }, { role: 'assistant', content: gen.output }])
    }
    setStarted(true)
    setError('')
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this chat?')) return
    await supabase.from('generations').delete().eq('id', id)
    if (currentChatId === id) handleNew()
    loadHistory()
  }

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || loading) return
    if (!started && (!subject || !taskType)) { setError('Required fields missing'); return }

    const controller = new AbortController()
    abortControllerRef.current = controller
    
    const isImage = attachedFile?.type === 'image'
    const userMessage: Message = { 
      role: 'user', 
      content: attachedFile ? `[File: ${attachedFile.name}] ${input}` : input 
    }
    
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setAttachedFile(null)
    setLoading(true)
    setStarted(true)
    setError('')

    try {
      const res = await fetch('/api/gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subject, 
          taskType, 
          messages: updatedMessages, 
          fileData: isImage ? null : attachedFile?.data 
        }),
        signal: controller.signal
      })

      if (!res.ok) throw new Error('Stream error')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullOutput = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.replace('data: ', '')
            if (data === '[DONE]') break
            try {
              const text = JSON.parse(data).choices[0].delta.content || ''
              fullOutput += text
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1].content = cleanText(fullOutput)
                return updated
              })
            } catch {}
          }
        }
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user && fullOutput) {
        const cleanedOutput = cleanText(fullOutput)
        const chatPayload = [...updatedMessages, { role: 'assistant', content: cleanedOutput }]
        
        if (currentChatId) {
          await supabase.from('generations').update({ output: JSON.stringify(chatPayload) }).eq('id', currentChatId)
        } else {
          const { data } = await supabase.from('generations').insert({ 
            user_id: user.id, tool: 'generate', subject, task_type: taskType, 
            input: userMessage.content, output: JSON.stringify(chatPayload) 
          }).select().single()
          if (data) setCurrentChatId(data.id)
        }
        loadHistory()
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') setError('Connection lost. Please try again.')
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 dark:bg-[#0f172a] dark:text-slate-100 transition-colors">
      <nav className="w-full bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
              {sidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
            </button>
            <Link href="/home" className="text-2xl font-bold text-blue-600 dark:text-white tracking-tight">IB Study Tools</Link>
          </div>
          <button onClick={handleLogout} className="text-base font-semibold text-slate-400 hover:text-red-500 transition">Logout</button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <aside className="w-80 border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex flex-col shrink-0">
            <div className="p-6">
              <button onClick={handleNew} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 text-base font-bold shadow-lg flex items-center justify-center gap-2 transition-all">
                <Plus size={20} /> New Session
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 space-y-2">
              {history.map(gen => (
                <button 
                  key={gen.id} 
                  onClick={() => loadGeneration(gen)} 
                  className={`group relative w-full text-left p-4 rounded-2xl transition-all border border-transparent ${currentChatId === gen.id ? 'bg-white dark:bg-slate-800 shadow-sm border-slate-100 dark:border-slate-700' : 'hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
                >
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate pr-6">{gen.subject}</p>
                  <p className="text-xs text-slate-400 truncate mt-1">{gen.task_type}</p>
                  <span onClick={(e) => handleDelete(e, gen.id)} className="absolute right-3 top-4 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">✕</span>
                </button>
              ))}
            </div>
          </aside>
        )}

        <main onDragOver={(e) => e.preventDefault()} onDrop={onDrop} className="flex-1 flex flex-col relative bg-white dark:bg-[#0f172a]">
          {!started && (
            <div className="absolute inset-0 flex items-center justify-center p-8 z-40 bg-white dark:bg-[#0f172a]">
              <div className="max-w-lg w-full space-y-10 text-center">
                <div className="space-y-3">
                  <h2 className="text-5xl font-black text-slate-900 dark:text-white">Tutor Mode</h2>
                  <p className="text-slate-500 text-lg font-medium">Select your focus area to begin.</p>
                </div>
                <div className="space-y-4">
                  <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-base font-bold outline-none appearance-none">
                    <option value="">Subject</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={taskType} onChange={e => setTaskType(e.target.value)} className="w-full p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-base font-bold outline-none appearance-none">
                    <option value="">Task Type</option>
                    {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => (subject && taskType) ? setStarted(true) : setError('Required fields missing')} className="w-full bg-blue-600 text-white rounded-2xl py-5 text-lg font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">Start Session</button>
                  {error && <p className="text-red-500 font-bold text-sm uppercase tracking-widest">{error}</p>}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-8 space-y-10 pb-44">
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-3xl px-8 py-5 shadow-sm text-base leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700'}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-4">
                  <div className="text-base font-bold text-blue-500 animate-pulse px-6 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">Tutor is thinking</div>
                  <button onClick={handleStop} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><StopCircle size={24} /></button>
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white dark:from-[#0f172a] via-white/90 dark:via-[#0f172a]/90 to-transparent z-30">
            <div className="max-w-4xl mx-auto space-y-4">
              {attachedFile && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl w-fit">
                    {attachedFile.type === 'pdf' ? <FileText size={18} className="text-blue-600" /> : <ImageIcon size={18} className="text-blue-600" />}
                    <span className="text-sm font-bold text-blue-600 uppercase tracking-tight">{attachedFile.name}</span>
                    <button onClick={() => setAttachedFile(null)} className="text-blue-400 hover:text-red-500 transition-colors"><X size={18} /></button>
                </div>
              )}
              <div className="flex gap-4 items-end bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[32px] p-3 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-lg">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="p-4 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl transition-all"><Paperclip size={24} /></button>
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder={attachedFile?.type === 'image' ? "Text-only model: describe the image..." : "Ask your tutor anything..."} className="flex-1 bg-transparent border-none p-4 text-base focus:outline-none resize-none max-h-48 dark:text-white" rows={1} />
                <button onClick={handleSend} disabled={loading || (!input.trim() && !attachedFile)} className="bg-slate-900 dark:bg-blue-600 text-white rounded-[24px] p-4 font-bold disabled:opacity-20 hover:scale-105 active:scale-95 transition-all shadow-md"><Send size={24} /></button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}