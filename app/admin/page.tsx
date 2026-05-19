'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const SUBJECTS = [
  'Mathematics AA', 'Mathematics AI',
  'Chemistry', 'Biology', 'Physics',
  'English Language & Literature', 'English Literature',
  'History', 'Economics', 'Psychology',
  'Global Politics',
  'Theory of Knowledge (TOK)',
  'Extended Essay (EE)',
  'Computer Science',
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

  const ADMIN_UID = 'c1f4b88e-c5dd-49cd-b72f-1a5d14dab1fe' // <--- REPLACE THIS

  // 1. GATEKEEPER: Redirect anyone who isn't you
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== ADMIN_UID) {
        window.location.href = '/'; 
      }
    };
    checkAdmin();
  }, [supabase]);

  // 2. FETCH PAPERS: Load the list on page load
  useEffect(() => {
    const fetchPapers = async () => {
      const { data, error } = await supabase
        .from('past_papers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setPapers(data);
    };
    fetchPapers();
  }, [supabase]);

  // 3. DELETE FUNCTION: Remove from Storage and DB
  const deletePaper = async (id: string, fileUrl: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this paper?");
    if (!confirmed) return;

    try {
      const fileName = fileUrl.split('/').pop();
      if (fileName) {
        const decodedFileName = decodeURIComponent(fileName);
        await supabase.storage.from('past-papers').remove([decodedFileName]);
      }

      const { error } = await supabase.from('past_papers').delete().eq('id', id);
      if (error) throw error;

      setPapers(prev => prev.filter(paper => paper.id !== id));
      alert("Deleted successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("Delete failed.");
    }
  };

  // 4. UPLOAD FUNCTION
  const handleUpload = async () => {
    if (!subject || !title || !file) {
      setMessage('Please fill in subject, title and select a file.')
      return
    }
    setLoading(true)
    setMessage('')

    const fileName = `${subject}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('past-papers')
      .upload(fileName, file)

    if (uploadError) {
      setMessage('Upload failed: ' + uploadError.message)
      setLoading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('past-papers').getPublicUrl(fileName)

    const { error: dbError } = await supabase.from('past_papers').insert({
      subject,
      title,
      year: year ? parseInt(year) : null,
      paper_type: paperType,
      file_url: urlData.publicUrl,
    })

    if (dbError) {
      setMessage('Database error: ' + dbError.message)
    } else {
      setMessage('✅ Paper uploaded successfully!')
      // Refresh list after upload
      const { data } = await supabase.from('past_papers').select('*').order('created_at', { ascending: false });
      if (data) setPapers(data);
      
      setTitle('')
      setYear('')
      setPaperType('')
      setFile(null)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto space-y-8">
        {/* UPLOAD FORM */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin — Upload Past Paper</h1>
          <p className="text-gray-500 text-sm mb-6">Access restricted to admin only.</p>

          {message && (
            <div className={`p-3 rounded-lg text-sm mb-4 ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          <div className="bg-white border rounded-xl p-6 space-y-4 shadow-sm">
            <select value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm text-gray-900 bg-white">
              <option value="">Select subject...</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm text-gray-900" />

            <input type="number" placeholder="Year" value={year} onChange={e => setYear(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm text-gray-900" />

            <input type="text" placeholder="Paper type" value={paperType} onChange={e => setPaperType(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm text-gray-900" />

            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
              <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm text-gray-600" />
            </div>

            <button onClick={handleUpload} disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
              {loading ? 'Uploading...' : 'Upload Paper'}
            </button>
          </div>
        </div>

        {/* MANAGE PAPERS SECTION */}
        <div className="pt-8 border-t">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Manage Existing Papers</h2>
          <div className="space-y-3">
            {papers.length === 0 ? (
              <p className="text-gray-400 text-sm italic text-center py-4">No papers found or loading...</p>
            ) : (
              papers.map((paper) => (
                <div key={paper.id} className="bg-white border rounded-lg p-4 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{paper.title}</p>
                    <p className="text-xs text-gray-500">{paper.subject} • {paper.year}</p>
                  </div>
                  <button
                    onClick={() => deletePaper(paper.id, paper.file_url)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}