'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const SUBJECTS = [
  'Mathematics AA', 'Mathematics AI', 'Chemistry', 'Biology', 'Physics',
  'English Language & Literature', 'English Literature', 'History', 'Economics', 
  'Psychology', 'Global Politics', 'Theory of Knowledge (TOK)', 
  'Extended Essay (EE)', 'Computer Science', 'General Chat',
]

const TASK_TYPES = [
  'Essay', 'IA Idea', 'Outline', 'Study Notes',
  'Revision Summary', 'Explanation', 'Practice Questions', 'Normal Chatting',
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

  const bottomRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => { loadHistory() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadHistory = async () => {
    const { data } = await supabase.from('generations').select('*').eq('tool', 'generate').order('created_at', { ascending: false }).limit(50)
    if (data) setHistory([...data].sort((a, b) => (b.metadata?.pinned ? 1 : 0) - (a.metadata?.pinned ? 1 : 0)))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleNew = () => {
    setSubject(''); setTaskType(''); setMessages([]); setInput(''); setError(''); setStarted(false); setCurrentChatId(null)
  }

  const loadGeneration = (gen: Generation) => {
    setSubject(gen.subject || ''); setTaskType(gen.task_type || ''); setCurrentChatId(gen.id)
    try {
      const parsed = JSON.parse(gen.output)
      setMessages(Array.isArray(parsed) ? parsed : [{ role: 'user', content: gen.input }, { role: 'assistant', content: gen.output }])
    } catch {
      setMessages([{ role: 'user', content: gen.input }, { role: 'assistant', content: gen.output }])
    }
    setStarted(true); setError('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this chat?')) return
    await supabase.from('generations').delete().eq('id', id)
    if (currentChatId === id) handleNew()
    loadHistory()
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    if (!started && (!subject || !taskType)) {
      setError('Select subject and task type'); return
    }

    const currentInput = input; 
    const userMessage: Message = { role: 'user', content: currentInput }
    
    // Create a deep copy of current messages for the API call
    let messagesForAPI = messages.map(m => ({ role: m.role, content: m.content }));
    
    if (messagesForAPI.length === 0) {
        messagesForAPI.push({
            role: 'system',
            content: `You are an expert IB Tutor for ${subject}. Speak clearly and professionally.`
        });
    }
    messagesForAPI.push(userMessage);

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setStarted(true);
    setError('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, taskType, prompt: currentInput, messages: messagesForAPI }),
      })

      if (!res.ok) throw new Error('Stream error');

      const reader = res.body?.getReader(); 
      const decoder = new TextDecoder(); 
      let fullOutput = ''
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (reader) {
        const { done, value } = await reader.read(); 
        if (done) break
        
        // Use stream: true to handle fragments of multi-byte characters
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
          
          const data = trimmedLine.replace('data: ', '');
          if (data === '[DONE]') break;
          
          try {
            const parsed = JSON.parse(data);
            const text = parsed.choices?.[0]?.delta?.content || '';
            if (text) {
              fullOutput += text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullOutput };
                return updated;
              });
            }
          } catch (e) {
            // Ignore parse errors for incomplete JSON chunks
          }
        }
      }

      // Finalizing: Save to database
      const { data: { user } } = await supabase.auth.getUser()
      if (user && fullOutput) {
        const finalChatHistory = [...messages, userMessage, { role: 'assistant', content: fullOutput }].filter(m => m.role !== 'system');
        
        if (currentChatId) {
          await supabase.from('generations').update({ output: JSON.stringify(finalChatHistory) }).eq('id', currentChatId)
        } else {
          const { data } = await supabase.from('generations').insert({ 
            user_id: user.id, 
            tool: 'generate', 
            subject, 
            task_type: taskType, 
            input: currentInput, 
            output: JSON.stringify(finalChatHistory) 
          }).select().single()
          if (data) setCurrentChatId(data.id)
        }
        loadHistory()
      }
    } catch (err) {
      setError('Connection lost. Please try again.');
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 dark:bg-[#0f172a] dark:text-slate-100 transition-colors">
      
      {/* --- ALIGNED NAVBAR --- */}
      <nav className="w-full bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-14 flex items-center"> 
                <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)} 
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                >
                  <span className={`text-lg font-bold transition-transform duration-300 ${sidebarOpen ? 'rotate-0' : 'rotate-180'}`}>
                    {sidebarOpen ? '←' : '→'}
                  </span>
                </button>
            </div>
            <Link href="/home" className="text-xl font-bold text-blue-600 dark:text-white" style={{ fontFamily: 'Georgia, serif' }}>
              IB Study Tools
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl p-1">
            {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${pathname === link.href ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                  {link.name}
                </Link>
            ))}
          </div>

          <button onClick={handleLogout} className="text-sm font-bold text-slate-400 hover:text-red-500 transition">Logout</button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <aside className="w-72 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col shrink-0">
            <div className="p-4">
              <button onClick={handleNew} className="w-full bg-slate-900 dark:bg-blue-600 text-white rounded-xl py-3 text-sm font-bold shadow-lg">+ New Session</button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              {history.map(gen => (
                <button key={gen.id} onClick={() => loadGeneration(gen)} className={`w-full text-left p-3 rounded-xl transition-all group relative ${currentChatId === gen.id ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <p className="text-xs font-bold truncate pr-4">{gen.subject} — {gen.task_type}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-1">{gen.input}</p>
                  <span onClick={(e) => { e.stopPropagation(); handleDelete(gen.id) }} className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 text-xs transition">✕</span>
                </button>
              ))}
            </div>
          </aside>
        )}

        <main className="flex-1 flex flex-col relative bg-white dark:bg-[#0f172a]">
          {!started && (
            <div className="absolute inset-0 flex items-center justify-center p-6 z-40 bg-white dark:bg-[#0f172a]">
              <div className="max-w-md w-full space-y-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black tracking-tight dark:text-white">Tutor Mode</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Configure your study session.</p>
                </div>
                <div className="grid gap-4">
                  <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-bold focus:border-blue-500 outline-none dark:text-white">
                    <option value="">Select Subject</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={taskType} onChange={e => setTaskType(e.target.value)} className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-bold focus:border-blue-500 outline-none dark:text-white">
                    <option value="">Select Task Type</option>
                    {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => { if(subject && taskType) setStarted(true); else setError('Select both fields') }} className="w-full bg-blue-600 text-white rounded-2xl py-4 font-bold shadow-xl active:scale-95">Start Session</button>
                  {error && <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{error}</p>}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.filter(m => m.role !== 'system').map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-3xl px-6 py-4 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200'}`}>
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && <div className="text-xs font-bold text-blue-500 animate-pulse px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full w-fit">Tutor is drafting...</div>}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 z-30">
            <div className="max-w-4xl mx-auto flex gap-4 items-end bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-2 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
              <textarea 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
                placeholder="Message your tutor..." 
                className="flex-1 bg-transparent border-none p-4 text-sm focus:outline-none resize-none dark:text-white" 
                rows={1} 
              />
              <button onClick={handleSend} disabled={loading || !input.trim()} className="bg-slate-900 dark:bg-blue-600 text-white rounded-2xl px-6 py-3.5 text-sm font-bold disabled:opacity-30 active:scale-95 transition-all">Send</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}