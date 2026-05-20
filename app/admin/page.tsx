'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Paper {
  id: string;
  subject: string;
  title: string;
  year: number;
  paper_type: string;
  file_url: string;
  order_index: number;
}

export default function AdminPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchPapers()
  }, [])

  const fetchPapers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('past_papers')
      .select('*')
      .order('order_index', { ascending: true })

    if (error) console.error('Error:', error)
    if (data) setPapers(data as Paper[])
    setLoading(false)
  }

  // Moves paper in the local list ONLY
  const movePaper = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= papers.length) return

    const newPapers = [...papers]
    const temp = newPapers[index]
    newPapers[index] = newPapers[targetIndex]
    newPapers[targetIndex] = temp

    setPapers(newPapers)
  }

  // Sends the entire new order to Supabase
  const saveOrder = async () => {
    setSaving(true)
    
    // Create an array of update promises
    // We use the current array index as the new order_index
    const updates = papers.map((paper, index) => {
      return supabase
        .from('past_papers')
        .update({ order_index: index })
        .eq('id', paper.id)
    })

    const results = await Promise.all(updates)
    const errors = results.filter(r => r.error)

    if (errors.length > 0) {
      alert("Error saving some changes. Please try again.")
      console.error(errors)
    } else {
      alert("Order saved successfully! Students will see the new order now.")
    }
    
    setSaving(false)
    fetchPapers() // Refresh from DB to confirm
  }

  const deletePaper = async (id: string) => {
    if (!confirm('Are you sure you want to delete this paper?')) return
    
    const { error } = await supabase.from('past_papers').delete().eq('id', id)
    if (error) alert(error.message)
    else fetchPapers()
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] p-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-slate-500">Manage your past papers and their display order.</p>
          </div>
          
          <div className="flex gap-4">
             <button 
                onClick={() => router.push('/admin/upload')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition shadow-lg shadow-blue-500/20"
              >
                + Upload New
              </button>
              
              <button 
                onClick={saveOrder}
                disabled={saving || loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {saving ? 'Saving Order...' : 'Save Changes'}
              </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Loading Archive...</div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Order</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Details</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {papers.map((paper, index) => (
                  <tr key={paper.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => movePaper(index, 'up')}
                          disabled={index === 0}
                          className="text-slate-400 hover:text-blue-500 disabled:opacity-10 transition"
                        >
                          ▲
                        </button>
                        <span className="text-center font-bold text-xs text-slate-300">{index + 1}</span>
                        <button 
                          onClick={() => movePaper(index, 'down')}
                          disabled={index === papers.length - 1}
                          className="text-slate-400 hover:text-blue-500 disabled:opacity-10 transition"
                        >
                          ▼
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase mb-1">{paper.subject}</p>
                      <p className="font-bold text-slate-900 dark:text-white">{paper.title}</p>
                      <p className="text-xs text-slate-400">{paper.year}</p>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                         {paper.paper_type}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <a 
                          href={paper.file_url} 
                          target="_blank" 
                          className="p-2 text-slate-400 hover:text-blue-500 transition"
                          title="View File"
                        >
                          👁️
                        </a>
                        <button 
                          onClick={() => deletePaper(paper.id)}
                          className="p-2 text-slate-400 hover:text-red-500 transition"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}