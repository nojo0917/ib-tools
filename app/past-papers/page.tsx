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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="font-bold text-lg text-blue-600" style={{ fontFamily: 'Georgia, serif' }}>
          IB Study Tools
        </h1>
        <div className="flex gap-4 text-sm">
          <a href="/home" className="text-gray-900 hover:text-blue-600">Home</a>
          <a href="/generate" className="text-gray-900 hover:text-blue-600">Generate</a>
          <a href="/ai-check" className="text-gray-900 hover:text-blue-600">AI Check</a>
          <a href="/humanize" className="text-gray-900 hover:text-blue-600">Humanize</a>
          <a href="/past-papers" className="font-medium text-blue-600">Past Papers</a>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Past Papers</h2>
          <p className="text-gray-700 text-sm mt-1">Browse and download IB past papers by subject.</p>
        </div>

        <select
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full sm:w-72 border rounded-lg p-3 text-sm bg-white text-gray-900"
        >
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {loading && (
          <p className="text-sm text-gray-400">Loading papers...</p>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">📄 No papers yet</p>
            <p className="text-sm">Papers will appear here once uploaded.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map(paper => (
            <div key={paper.id} className="bg-white border rounded-xl p-5 flex flex-col gap-3">
              <div>
                <p className="text-xs text-blue-600 font-medium mb-1">{paper.subject}</p>
                <h3 className="text-sm font-semibold text-gray-900">{paper.title}</h3>
                <div className="flex gap-2 mt-1">
                  {paper.year && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {paper.year}
                    </span>
                  )}
                  {paper.paper_type && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                      {paper.paper_type}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-auto">
                
                  href={paper.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center text-xs bg-gray-100 text-gray-700 rounded-lg py-2 hover:bg-gray-200"
                >
                  View
                </a>
                
                  href={paper.file_url}
                  download
                  className="flex-1 text-center text-xs bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700"
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