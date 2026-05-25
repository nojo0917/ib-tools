'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'

export default function UploadPage() {
  const [loading, setLoading] = useState(false)
  const [fetchingSubjects, setFetchingSubjects] = useState(true)
  const [subjects, setSubjects] = useState<string[]>([])
  const [message, setMessage] = useState({ text: '', type: '' })
  
  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    year: new Date().getFullYear(),
    paper_type: 'Paper 1',
    file_url: '',
    model_answer_url: '',
    order_index: 0
  })

  const supabase = createClient()
  const router = useRouter()

  // Fetch unique subjects from your database on load
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data, error } = await supabase
        .from('past_papers')
        .select('subject')
      
      if (!error && data) {
        // Filter for unique subject names and sort alphabetically
        const uniqueSubjects = Array.from(new Set(data.map(item => item.subject))).sort()
        setSubjects(uniqueSubjects)
        
        // Auto-select the first subject if available
        if (uniqueSubjects.length > 0) {
          setFormData(prev => ({ ...prev, subject: uniqueSubjects[0] }))
        }
      }
      setFetchingSubjects(false)
    }

    fetchSubjects()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('past_papers').insert([formData])

    if (error) {
      setMessage({ text: error.message, type: 'error' })
      setLoading(false)
    } else {
      setMessage({ text: 'Entry added successfully!', type: 'success' })
      setTimeout(() => router.push('/admin'), 1500)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        
        <button 
          onClick={() => router.push('/admin')}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm mb-8 transition-colors group"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </button>

        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Georgia, serif' }}>
              Add New Resource
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Select an existing subject to add a paper.</p>
          </div>

          {message.text && (
            <div className={`p-4 rounded-2xl mb-6 text-sm font-bold text-center ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {/* SUBJECT SELECTOR */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-2">Subject</label>
                {fetchingSubjects ? (
                  <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex items-center gap-2 text-slate-400 text-sm">
                    <Loader2 size={16} className="animate-spin" /> Loading subjects...
                  </div>
                ) : (
                  <select
                    required
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all appearance-none text-slate-900 dark:text-white"
                  >
                    {subjects.length > 0 ? (
                      subjects.map(s => <option key={s} value={s}>{s}</option>)
                    ) : (
                      <option disabled>No subjects found</option>
                    )}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-2">Year</label>
                <input
                  type="number"
                  required
                  value={formData.year}
                  onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-2">Paper Title</label>
              <input
                required
                placeholder="e.g. May 2023 Timezone 1"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-2">Paper Type</label>
              <select
                value={formData.paper_type}
                onChange={e => setFormData({...formData, paper_type: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all appearance-none text-slate-900 dark:text-white"
              >
                <option>Paper 1</option>
                <option>Paper 2</option>
                <option>Paper 3</option>
                <option>Internal Assessment</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-2">Official PDF Link</label>
              <input
                required
                type="url"
                placeholder="https://..."
                value={formData.file_url}
                onChange={e => setFormData({...formData, file_url: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-2">AI Model Answer Link</label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.model_answer_url}
                onChange={e => setFormData({...formData, model_answer_url: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading || fetchingSubjects}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? 'Publishing...' : (
                <>
                  Publish Entry <Send size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}