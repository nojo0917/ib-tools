'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const SUBJECTS = [
  'All Subjects', 'Mathematics AA', 'Mathematics AI', 'Chemistry', 'Biology', 
  'Physics', 'English Language & Literature', 'English Literature', 'History', 
  'Economics', 'Psychology', 'Global Politics', 'Theory of Knowledge (TOK)', 
  'Extended Essay (EE)', 'Computer Science',
]

interface Paper {
  id: string; subject: string; title: string; year: number;
  paper_type: string; file_url: string;
}

export default function PastPapersPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [filtered, setFiltered] = useState<Paper[]>([])
  const [subject, setSubject] = useState('All Subjects')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
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

  useEffect(() => { loadPapers() }, [])
  useEffect(() => {
    setFiltered(subject === 'All Subjects' ? papers : papers.filter(p => p.subject === subject))
  }, [subject, papers])

  const loadPapers = async () => {
    const { data } = await supabase.from('past_papers').select('*').order('year', { ascending: false })
    if (data) { setPapers(data); setFiltered(data); }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 dark:bg-[#0f172a] dark:text-slate-100 transition-colors">
      
      {/* --- MATCHED NAVBAR DIMENSIONS --- */}
      <nav className="w-full bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all shadow-sm"
            >
              <span className={`text-lg font-bold transition-transform duration-300 ${sidebarOpen ? 'rotate-0' : 'rotate-180'}`}>
                {sidebarOpen ? '←' : '→'}
              </span>
            </button>
            {/* Font matched to AI Check screenshot style */}
            <Link href="/home" className="text-xl font-bold tracking-tight dark:text-white text-slate-900">
              IB Study Tools
            </Link>
          </div>

          {/* Pill Nav matched to AI Check screenshot */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl p-1">
            {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    pathname === link.href 
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
            ))}
          </div>

          <button onClick={handleLogout} className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors">
            Logout
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <aside className="w-72 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col shrink-0">
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Subject Filter</h3>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </aside>
        )}

        <main className="flex-1 overflow-y-auto bg-white dark:bg-[#0f172a] p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <header>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Past Papers</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Archive of official IB examination papers.</p>
            </header>

            {loading ? (
              <div className="flex items-center gap-3 text-sm font-bold text-blue-500 animate-pulse px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full w-fit">
                <span>📄</span> Loading papers...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xl font-black text-slate-900 dark:text-white">No papers found for this subject.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {filtered.map(paper => (
                  <div key={paper.id} className="group flex flex-col bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="mb-6">
                      <p className="text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400 font-black mb-3">{paper.subject}</p>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-4">{paper.title}</h3>
                      <div className="flex gap-2">
                        <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg">{paper.year}</span>
                        <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg">{paper.paper_type}</span>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-auto">
                      <a href={paper.file_url} target="_blank" className="flex-1 text-center text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl py-3 hover:bg-slate-200 dark:hover:bg-slate-700 transition">View</a>
                      <a href={paper.file_url} download className="flex-1 text-center text-xs font-bold bg-blue-600 text-white rounded-xl py-3 hover:bg-blue-700 transition shadow-lg shadow-blue-500/20">Download</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}