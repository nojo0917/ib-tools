'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Paperclip, X, Image as ImageIcon, FileText, 
  ChevronLeft, ChevronRight, Plus, Send, StopCircle,
  Pin, Edit2, Trash2
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
  output: string; created_at: string;
  metadata?: { pinned?: boolean; label?: string }
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
  const pathname = usePathname()
  const supabase = createClient()

  const navLinks = [
    { name: 'Home', href: '/home' },
    { name: 'Generate', href: '/generate' },
    { name: 'AI Check', href: '/ai-check' },
    { name: 'AI Polish', href: '/ai-polish' }, 
    { name: 'Practice Papers', href: '/practice-papers' },
  ]

  useEffect(() => { loadHistory() }, [])

  const loadHistory = async () => {
    const { data } = await supabase
      .from('generations')
      .select('*')
      .eq('tool', 'generate')
      .order('created_at', { ascending: false })
    
    if (data) {
      const sorted = [...data].sort((a, b) => (b.metadata?.pinned ? 1 : 0) - (a.metadata?.pinned ? 1 : 0))
      setHistory(sorted)
    }
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
      setLoading(false)
    }
  }

  const cleanText = (text: string) => {
    return text.replace(/\*\*/g, '').replace(/\|/g, '').replace(/---/g, '').replace(/#/g, '').trim();
  }

  const processFile = (file: File) => {
    const reader = new FileReader()
    if (file.type === "application/pdf") {
      reader.onload = (e) => setAttachedFile({ name: file.name, type: 'pdf', data: e.target?.result as string })
      reader.readAsText(file)
    } else {
      reader.onload = (e) => setAttachedFile({ name: file.name, type: 'image', data: e.target?.result as string })
      reader.readAsDataURL(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const togglePin = async (id: string, currentPinned: boolean) => {
    const { data: existing } = await supabase.from('generations').select('metadata').eq('id', id).single()
    const newMetadata = { ...(existing?.metadata || {}), pinned: !currentPinned }
    await supabase.from('generations').update({ metadata: newMetadata }).eq('id', id)
    loadHistory()
  }

  const renameChat = async (id: string) => {
    const newLabel = prompt("Enter new session name:")
    if (!newLabel) return
    const { data: existing } = await supabase.from('generations').select('metadata').eq('id', id).single()
    const newMetadata = { ...(existing?.metadata || {}), label: newLabel }
    await supabase.from('generations').update({ metadata: newMetadata }).eq('id', id)
    loadHistory()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this session?')) return
    await supabase.from('generations').delete().eq('id', id)
    if (currentChatId === id) handleNew()
    loadHistory()
  }

  const loadGeneration = (gen: Generation) => {
    handleStop()
    setSubject(gen.subject); setTaskType(gen.task_type); setCurrentChatId(gen.id);
    try {
      const parsed = JSON.parse(gen.output)
      setMessages(parsed)
    } catch {
      setMessages([{ role: 'user', content: gen.input }, { role: 'assistant', content: gen.output }])
    }
    setStarted(true)
  }

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || loading) return
    if (!started && (!subject || !taskType)) return

    const controller = new AbortController()
    abortControllerRef.current = controller
    const userMessage: Message = { role: 'user', content: attachedFile ? `[File: ${attachedFile.name}] ${input}` : input }
    const updatedMessages = [...messages, userMessage]
    
    setMessages(updatedMessages)
    setInput(''); setAttachedFile(null); setLoading(true); setStarted(true)

    try {
      const res = await fetch('/api/gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, taskType, messages: updatedMessages, fileData: attachedFile?.type === 'image' ? null : attachedFile?.data }),
        signal: controller.signal
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullOutput = '', buffer = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
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
        const payload = [...updatedMessages, { role: 'assistant', content: cleanText(fullOutput) }]
        if (currentChatId) {
          await supabase.from('generations').update({ output: JSON.stringify(payload) }).eq('id', currentChatId)
        } else {
          const { data } = await supabase.from('generations').insert({ 
            user_id: user.id, tool: 'generate', subject, task_type: taskType, 
            input: userMessage.content, output: JSON.stringify(payload) 
          }).select().single()
          if (data) setCurrentChatId(data.id)
        }
        loadHistory()
      }
    } catch (e) { setError('Error occurred') } finally { setLoading(false) }
  }

  return (
    <div className="h-screen flex flex-col bg-[#0f172a] text-slate-100 overflow-hidden font-sans">
      
      {/* FLOATING PILL NAVBAR CONTAINER */}
      <header className="w-full pt-6 px-12 shrink-0 z-50">
        <div className="max-w-[1600px] mx-auto h-16 bg-[#1e293b]/50 backdrop-blur-xl border border-slate-700/50 rounded-full px-8 flex items-center justify-between shadow-2xl">
          
          {/* Left: Sidebar Toggle + Logo */}
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
              {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
            <Link href="/home">
              <span className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                IB Study Tools
              </span>
            </Link>
          </div>

          {/* Center: The Navigation Pill Links */}
          <div className="hidden md:flex items-center gap-1 bg-[#0f172a]/40 border border-slate-700/30 rounded-2xl p-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`px-5 py-1.5 rounded-xl text-sm font-bold transition-all ${
                    isActive 
                      ? 'bg-slate-700/60 text-blue-400 shadow-lg border border-slate-600/50' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Right: Logout Button */}
          <button onClick={handleLogout} className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors px-2">
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden mt-4">
        {/* SIDEBAR */}
        {sidebarOpen && (
          <aside className="w-72 border-r border-slate-800 bg-[#0f172a] flex flex-col shrink-0">
            <div className="p-4">
              <button onClick={handleNew} className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20">
                <Plus size={16} /> New Session
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              {history.map(gen => (
                <div key={gen.id} className={`group relative w-full p-3 rounded-xl transition-all border border-transparent flex flex-col cursor-pointer ${currentChatId === gen.id ? 'bg-slate-800 border-slate-700 shadow-md' : 'hover:bg-slate-800/40'}`} onClick={() => loadGeneration(gen)}>
                  <div className="flex items-center justify-between pr-8">
                    <p className="text-xs font-bold truncate">{gen.metadata?.label || gen.subject}</p>
                    {gen.metadata?.pinned && <Pin size={10} className="text-blue-400 fill-blue-400" />}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{gen.task_type}</p>
                  
                  {/* SIDEBAR ACTIONS */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 shadow-xl">
                    <button onClick={(e) => { e.stopPropagation(); togglePin(gen.id, !!gen.metadata?.pinned) }} className="p-1 hover:text-blue-400"><Pin size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); renameChat(gen.id) }} className="p-1 hover:text-emerald-400"><Edit2 size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(gen.id) }} className="p-1 hover:text-red-400"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        <main className="flex-1 flex flex-col relative overflow-hidden">
          {!started && (
            <div className="absolute inset-0 flex items-center justify-center p-8 z-40 bg-[#0f172a]">
              <div className="max-w-lg w-full space-y-8 text-center">
                <h2 className="text-6xl font-black tracking-tighter text-white">Tutor Mode</h2>
                <div className="space-y-4">
                  <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-5 rounded-2xl border border-slate-700 bg-slate-800/50 font-bold outline-none shadow-xl focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
                    <option value="">Select Subject</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={taskType} onChange={e => setTaskType(e.target.value)} className="w-full p-5 rounded-2xl border border-slate-700 bg-slate-800/50 font-bold outline-none shadow-xl focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
                    <option value="">Select Task Type</option>
                    {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => (subject && taskType) ? setStarted(true) : setError('Select options')} className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-2xl py-5 text-xl font-black shadow-2xl active:scale-95 transition-all">Start Learning</button>
                </div>
              </div>
            </div>
          )}

          {/* CHAT DISPLAY (No white background) */}
          <div className="flex-1 overflow-y-auto p-8 space-y-12 pb-48">
            <div className="max-w-4xl mx-auto space-y-12">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-[2.5rem] px-10 py-7 text-xl leading-relaxed shadow-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-100 border border-slate-700/50'}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-4">
                  <div className="text-lg font-bold text-blue-400 animate-pulse px-8 py-4 bg-blue-900/20 border border-blue-500/20 rounded-full">Assistant is processing...</div>
                  <button onClick={handleStop} className="p-3 text-red-400 hover:bg-red-500/10 rounded-full transition-colors"><StopCircle size={28} /></button>
                </div>
              )}
            </div>
          </div>

          {/* INPUT AREA */}
          <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/90 to-transparent z-30">
            <div className="max-w-4xl mx-auto space-y-4">
              {attachedFile && (
                <div className="flex items-center gap-3 p-3 bg-blue-900/30 border border-blue-500/30 rounded-2xl w-fit backdrop-blur-sm">
                  {attachedFile.type === 'pdf' ? <FileText size={20} className="text-blue-400" /> : <ImageIcon size={20} className="text-blue-400" />}
                  <span className="text-xs font-black uppercase tracking-tighter">{attachedFile.name}</span>
                  <button onClick={() => setAttachedFile(null)} className="hover:text-red-400"><X size={20} /></button>
                </div>
              )}
              <div className="flex gap-4 items-end bg-slate-800 border border-slate-700/50 rounded-[3rem] p-5 shadow-2xl focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="p-4 text-slate-400 hover:text-blue-400 transition-colors"><Paperclip size={28} /></button>
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="Message your IB Tutor..." className="flex-1 bg-transparent border-none py-4 text-xl focus:outline-none resize-none max-h-56 text-white placeholder-slate-500" rows={1} />
                <button onClick={handleSend} disabled={loading || (!input.trim() && !attachedFile)} className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-5 active:scale-90 transition-all shadow-xl disabled:opacity-30">
                  <Send size={28} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}