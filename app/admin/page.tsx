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
      .order('order_index', { ascending: true }); // Sort by our custom order
    
    if (data) setPapers(data);
  };

  // --- REORDERING LOGIC ---
  const movePaper = async (index: number, direction: 'up' | 'down') => {
    const paperToMove = papers[index];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const paperToSwapWith = papers[targetIndex];

    if (!paperToSwapWith) return; // Already at the top or bottom

    setLoading(true);

    // Swap their order_index values in the DB
    const { error: err1 } = await supabase
      .from('past_papers')
      .update({ order_index: paperToSwapWith.order_index })
      .eq('id', paperToMove.id);

    const { error: err2 } = await supabase
      .from('past_papers')
      .update({ order_index: paperToMove.order_index })
      .eq('id', paperToSwapWith.id);

    if (err1 || err2) {
      alert("Error reordering papers");
    } else {
      await fetchPapers();
    }
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

    // Determine the next order index (current max + 1)
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
      order_index: nextIndex // Assign the next position
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* UPLOAD FORM */}
        <div className="bg-white border rounded-xl p-6 space-y-4 shadow-sm">
          <h1 className="text-xl font-bold">Upload New Paper</h1>
          <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full border rounded-lg p-3 text-sm bg-white">
            <option value="">Select subject...</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-lg p-3 text-sm" />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Year" value={year} onChange={e => setYear(e.target.value)} className="border rounded-lg p-3 text-sm" />
            <input type="text" placeholder="Paper type" value={paperType} onChange={e => setPaperType(e.target.value)} className="border rounded-lg p-3 text-sm" />
          </div>
          <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="text-xs block w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          <button onClick={handleUpload} disabled={loading} className="w-full bg-blue-600 text-white rounded-lg py-3 text-sm font-bold disabled:opacity-50">
            {loading ? 'Processing...' : 'Upload Paper'}
          </button>
          {message && <p className="text-center text-sm font-bold mt-2">{message}</p>}
        </div>

        {/* MANAGE SECTION */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Manage & Reorder</h2>
          {papers.map((paper, index) => (
            <div key={paper.id} className="bg-white border rounded-xl p-4 flex items-center gap-4 shadow-sm group">
              {/* Order Controls */}
              <div className="flex flex-col gap-1">
                <button 
                  disabled={index === 0 || loading}
                  onClick={() => movePaper(index, 'up')}
                  className="p-1 hover:bg-slate-100 rounded disabled:opacity-20"
                >
                  ▲
                </button>
                <button 
                  disabled={index === papers.length - 1 || loading}
                  onClick={() => movePaper(index, 'down')}
                  className="p-1 hover:bg-slate-100 rounded disabled:opacity-20"
                >
                  ▼
                </button>
              </div>
              
              <div className="flex-1">
                <p className="font-bold text-sm leading-none">{paper.title}</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{paper.subject} • {paper.year}</p>
              </div>

              <button
                onClick={() => deletePaper(paper.id, paper.file_url)}
                className="opacity-0 group-hover:opacity-100 px-3 py-1.5 text-red-500 text-xs font-bold transition"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}