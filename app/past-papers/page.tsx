'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const SUBJECTS = [
  'All Subjects',
  'Mathematics AA', 'Mathematics AI',
  'Chemistry', 'Biology', 'Physics',
  'English Language & Literature', 'English Literature',
  'History', 'Economics', 'Psychology',
  'Global Politics',
  'Theory of Knowledge (TOK)',
  'Extended Essay (EE)',
  'Computer Science',
]

interface Paper {
  id: string
  subject: string
  title: string
  year: number
  paper_type: string
  file_url: string
}

export default function PastPapersPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [filtered, setFiltered] = useState<Paper[]>([])
  const [subject, setSubject] = useState('All Subjects')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadPapers()
  }, [])

  useEffect(() => {
    if (subject === 'All Subjects') {
      setFiltered(papers)
    } else {
      setFiltered(papers.filter(p => p.subject === subject))
    }
  }, [subject, papers])

  const loadPapers = async () => {
    const { data } = await supabase
      .from('past_papers')
      .select('*')
      .order('year', { ascending: false })
    if (data) {
      setPapers(data)
      setFiltered(data)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex flex-col text-gray-900 bg-white dark:text-white dark:bg-gradient-to-br dark:from-[#15284c] dark:to-[#0a1128]">
      
      {/* Adaptive Navbar */}
      <nav className="border-b border-gray-200 dark:border-white/10 px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-black/10 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="font-bold text-lg text-blue-600 dark:text-white" style={{ fontFamily: 'Georgia, serif' }}>
          IB Study Tools
        </h1>
        <div className="flex gap-4 text-sm font-medium">
          <a href="/home" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition">Home</a>
          <a href="/generate" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition">Generate</a>
          <a href="/ai-check" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition">AI Check</a>
          <a href="/humanize" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white transition">Humanize</a>
          <a href="/past-papers" className="text-blue-600 dark:text-white border-b-2 border-blue-600 dark:border-white pb-1">Past Papers</a>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto w-full p-6 space-y-8 mt-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Past Papers</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            Browse and download IB past papers by subject and year.
          </p>
        </div>

        {/* Adaptive Dropdown */}
        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full sm:w-72 border border-gray-300 dark:border-white/20 rounded-xl p-3 text-sm bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
        >
          {SUBJECTS.map(s => <option key={s} value={s} className="bg-white dark:bg-[#0f172a]">{s}</option>)}
        </select>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-400 animate-pulse">
            <span>📄</span> Loading database...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-white/10">
            <p className="text-4xl mb-4">📄</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">No papers yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Select a different subject or check back later.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {filtered.map(paper => (
            <div key={paper.id} className="group relative bg-white dark:bg-white/[0.03] border-2 border-gray-200 dark:border-white/10 rounded-[1.5rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400 font-black mb-2">{paper.subject}</p>
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {paper.title}
                </h3>
                <div className="flex gap-2 mt-3">
                  {paper.year && (
                    <span className="text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                      {paper.year}
                    </span>
                  )}
                  {paper.paper_type && (
                    <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                      {paper.paper_type}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-auto">
                <a
                  href={paper.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center text-xs font-bold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 rounded-lg py-2.5 hover:bg-gray-200 dark:hover:bg-white/20 transition"
                >
                  View
                </a>
                <a
                  href={paper.file_url}
                  download
                  className="flex-1 text-center text-xs font-bold bg-blue-600 text-white rounded-lg py-2.5 hover:bg-blue-700 transition shadow-md shadow-blue-500/20"
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}