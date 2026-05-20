'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const SUBJECTS = [
  'All Subjects', 'Mathematics AA', 'Mathematics AI', 'Chemistry', 'Biology', 
  'Physics', 'English Language & Literature', 'English Literature', 'History', 
  'Economics', 'Psychology', 'Global Politics', 'Theory of Knowledge (TOK)', 
  'Extended Essay (EE)', 'Computer Science',
]

// UPDATED: Removed 'Markscheme' from the array
const PAPER_TYPES = ['All Types', 'Paper 1', 'Paper 2', 'Paper 3', 'Specimen']

interface Paper {
  id: string; 
  subject: string; 
  title: string; 
  year: number;
  paper_type: string; 
  file_url: string;          // Official Save My Exams Link
  model_answer_url: string;   // Your AI Response Link
  order_index: number;
}

export default function PracticePapersPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [filtered, setFiltered] = useState<Paper[]>([])
  const [subject, setSubject] = useState('All Subjects')
  const [selectedType, setSelectedType] = useState('All Types')
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
    { name: 'Practice Papers', href: '/practice-papers' },
  ]

  const loadPapers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('past_papers')
      .select('*')
      .order('order_index', { ascending: true }) 
      
    if (error) {
      console.error('Error fetching papers:', error.message)
    } else if (data) { 
      setPapers(data as Paper[]) 
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { 
    loadPapers() 
  }, [loadPapers])

  useEffect(() => {
    let result = [...papers]
    if (subject !== 'All Subjects') result = result.filter(p => p.subject === subject)
    if (selectedType !== 'All Types') result = result.filter(p => p.paper_type === selectedType)
    setFiltered(result)
  }, [subject, selectedType, papers])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 dark:bg-[#0f172a] dark:text-slate-100 transition-colors duration-300">
      
      <nav className="w-full bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-14 shrink-0 flex items-center">
               <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)} 
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                >
                 <span className={`text-lg font-bold transition-transform duration-300 ${sidebarOpen ? 'rotate-0' : 'rotate-180'}`}>
                   {sidebarOpen ? '←' : '→'}
                 </span>
               </button>
            </div>
            <Link href="/home">
              <span className="text-xl font-bold text-blue-600 dark:text-white" style={{ fontFamily: 'Georgia, serif' }}>
                IB Study Tools
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl p-1">
            {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${pathname === link.href ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                >
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
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Subject Filter</h3>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full border-2 border-slate-100 dark:border-slate-800 rounded-xl p-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </aside>
        )}

        <main className="flex-1 overflow-y-auto bg-white dark:bg-[#0f172a] p-8 lg:p-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <header className="space-y-2">
              <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Practice Papers</h2>
              <p className="text-slate-500 dark:text-slate-400 text-base font-medium">Curated exam-style questions with AI-powered support.</p>
            </header>

            <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              {PAPER_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedType === type
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center gap-3 text-blue-500 font-bold py-10">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Loading archive...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <p className="font-bold text-slate-400">No {selectedType === 'All Types' ? '' : selectedType} found for this subject.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {filtered.map(paper => (
                  <div 
                    key={paper.id} 
                    className="group flex flex-col bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all duration-300"
                  >
                    <div className="mb-6">
                      <p className="text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400 font-black mb-3">
                        {paper.subject}
                      </p>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-4">
                        {paper.title}
                      </h3>
                      <div className="flex gap-2">
                        <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-lg">
                          {paper.year}
                        </span>
                        <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-500/10 text-blue-600 px-2.5 py-1 rounded-lg">
                          {paper.paper_type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 mt-auto">
                      <a 
                        href={paper.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-full text-center text-xs font-bold bg-slate-100 dark:bg-slate-800 dark:text-slate-100 rounded-xl py-3 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        View Official Paper
                      </a>
                      <a 
                        href={paper.model_answer_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-full text-center text-xs font-bold bg-blue-600 text-white rounded-xl py-3 hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
                      >
                        View AI Model Answer
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <footer className="mt-20 pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="max-w-2xl mx-auto space-y-4">
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                  <span className="block font-bold mb-1 uppercase tracking-wider text-slate-500 dark:text-slate-400">Legal Disclaimer</span>
                  The practice papers provided on this platform are linked directly to 
                  <a 
                    href="https://www.savemyexams.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 hover:underline mx-1 font-bold"
                  >
                    Save My Exams
                  </a>. 
                  All model answers and supporting solutions have been independently generated by Gemini AI for educational assistance and guidance.
                </p>
                
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic leading-relaxed">
                  This platform is an independent educational resource and is <strong>not officially affiliated with, endorsed by, or sponsored by Save My Exams Ltd</strong>. 
                  IB Study Tools does not host or redistribute copyrighted materials. All trademarks belong to their respective owners.
                </p>
              </div>
            </footer>

          </div>
        </main>
      </div>
    </div>
  )
}