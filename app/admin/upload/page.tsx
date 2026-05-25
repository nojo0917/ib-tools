'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'

export default function UploadPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  
  // Form State
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    const { error } = await supabase
      .from('past_papers')
      .insert([formData])

    if (error) {
      setMessage({ text: error.message, type: 'error' })
      setLoading(false)
    } else {
      setMessage({ text: 'Entry added successfully!', type: 'success' })
      // Redirect back to admin dashboard after a short delay
      setTimeout(() => router.push('/admin'), 1500)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        
        {/* Navigation Header */}
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
            <p className="text-slate-500 font-medium">Link official papers and AI model answers.</p>
          </div>

          {message.text && (
            <div className={`p-4 rounded-2xl mb-6 text-sm font-bold text-center ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-2">Subject</label>
                <input
                  required
                  placeholder="e.g. Physics HL"
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-2">Year</label>
                <input
                  type="number"
                  required
                  value={formData.year}
                  onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
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
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-2">Paper Type</label>
              <select
                value={formData.paper_type}
                onChange={e => setFormData({...formData, paper_type: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
              >
                <option>Paper 1</option>
                <option>Paper 2</option>
                <option>Paper 3</option>
                <option>Internal Assessment</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-2">Official PDF Link (External URL)</label>
              <input
                required
                type="url"
                placeholder="https://..."
                value={formData.file_url}
                onChange={e => setFormData({...formData, file_url: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 ml-2">AI Model Answer Link</label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.model_answer_url}
                onChange={e => setFormData({...formData, model_answer_url: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : (
                <>
                  Publish Resource <Send size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}