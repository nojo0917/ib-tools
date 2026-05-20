'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const SUBJECTS = [
  'Mathematics AA', 'Mathematics AI', 'Chemistry', 'Biology', 'Physics',
  'English Language & Literature', 'English Literature', 'History', 'Economics', 
  'Psychology', 'Global Politics', 'Theory of Knowledge (TOK)', 
  'Extended Essay (EE)', 'Computer Science',
]

export default function AdminPage() {
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [year, setYear] = useState('')
  const [paperType, setPaperType] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [papers, setPapers] = useState<any[]>([]) 
  const supabase = createClient()

  const ADMIN_UID = 'c1f4b88e-c5dd-49cd-b72f-1a5d14dab1fe'

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== ADMIN_UID) {
        window.location.href = '/'; 
      }
    };
    checkAdmin();
  }, [supabase]);

  useEffect(() => {
    fetchPapers();
  }, [supabase]);

  const fetchPapers = async () => {
    const { data } = await supabase
      .from('past_papers')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (data) setPapers(data);
  };

  const movePaper = async (index: number, direction: 'up' | 'down') => {
    const paperToMove = papers[index];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const paperToSwapWith = papers[targetIndex];

    if (!paperToSwapWith) return;

    setLoading(true);
    const { error: err1 } = await supabase
      .from('past_papers')
      .update({ order_index: paperToSwapWith.order_index })
      .eq('id', paperToMove.id);

    const { error: err2 } = await supabase
      .from('past_papers')
      .update({ order_index: paperToMove.order_index })
      .eq('id', paperToSwapWith.id);

    if (!err1 && !err2) await fetchPapers();
    setLoading(false);
  };

  const deletePaper = async (id: string, fileUrl: string) => {
    const confirmed = window.confirm("Are you sure?");
    if (!confirmed) return;
    try {
      const fileName = fileUrl.split('/').pop();
      if (fileName) await supabase.storage.from('past-papers').remove([decodeURIComponent(fileName)]);
      await supabase.from('past_papers').delete().eq('id', id);
      setPapers(prev => prev.filter(paper => paper.id !== id));
    } catch (error) {
      alert("Delete failed.");
    }
  };

  const handleUpload = async () => {
    if (!subject || !title || !file) {
      setMessage('Fill all fields.'); return;
    }
    setLoading(true);
    setMessage('');

    const nextIndex = papers.length > 0 ? Math.max(...papers.map(p => p.order_index || 0)) + 1 : 0;
    const fileName = `${subject}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('past-papers').upload(fileName, file);

    if (uploadError) {
      setMessage('Upload failed'); setLoading(false); return;
    }

    const { data: urlData } = supabase.storage.from('past-papers').getPublicUrl(fileName);

    const { error: dbError } = await supabase.from('past_papers').insert({
      subject, title, 
      year: year ? parseInt(year) : null,
      paper_type: paperType,
      file_url: urlData.publicUrl,
      order_index: nextIndex
    });

    if (dbError) {
      setMessage('DB error: ' + dbError.message);
    } else {
      setMessage('✅ Uploaded!');
      fetchPapers();
      setTitle(''); setYear(''); setPaperType(''); setFile(null);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* --- UPLOAD FORM --- */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-5 shadow-sm">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Upload New Paper</h1>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value)} 
                className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm bg-slate-50 text-slate-900 focus:border-blue-500 outline-none transition-all">
                <option value="">Select subject...</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Title</label>
              <input type="text" placeholder="e.g. Analysis and Approaches SL P1" value={title} onChange={e => setTitle(e.target.value)} 
                className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 outline-none transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Year</label>
                <input type="number" placeholder="2024" value={year} onChange={e => setYear(e.target.value)} 
                  className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm bg-slate-50 text-slate-900 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Type</label>
                <input type="text" placeholder="Paper 1" value={paperType} onChange={e => setPaperType(e.target.value)} 
                  className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm bg-slate-50 text-slate-900 outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="pt-2">
              <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} 
                className="text-xs block w-full text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all cursor-pointer" />
            </div>
          </div>

          <button onClick={handleUpload} disabled={loading} 
            className="w-full bg-slate-900 text-white rounded-xl py-4 text-sm font-bold shadow-lg active:scale-[0.98] transition-all disabled:opacity-50">
            {loading ? 'Processing...' : 'Upload Paper'}
          </button>
          
          {message && <p className={`text-center text-xs font-bold ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
        </div>

        {/* --- MANAGE SECTION --- */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 px-1">Manage & Reorder</h2>
          
          {papers.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 font-medium">
              No papers found. Upload one to start.
            </div>
          ) : (
            papers.map((paper, index) => (
              <div key={paper.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-6 shadow-sm group hover:border-blue-300 transition-all">
                
                {/* Reorder Controls */}
                <div className="flex flex-col gap-2">
                  <button 
                    disabled={index === 0 || loading}
                    onClick={() => movePaper(index, 'up')}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-900 disabled:opacity-10 transition-colors"
                  >
                    <span className="text-base font-bold">▲</span>
                  </button>
                  <button 
                    disabled={index === papers.length - 1 || loading}
                    onClick={() => movePaper(index, 'down')}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-900 disabled:opacity-10 transition-colors"
                  >
                    <span className="text-base font-bold">▼</span>
                  </button>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{paper.title}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{paper.subject}</span>
                    <span className="text-[10px] font-black text-slate-400 px-2 py-0.5 bg-slate-50 rounded">{paper.year}</span>
                  </div>
                </div>

                <button
                  onClick={() => deletePaper(paper.id, paper.file_url)}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}