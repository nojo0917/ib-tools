'use client'
import { useState } from 'react'
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
  const supabase = createClient()

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

    const { data: urlData } = supabase.storage
      .from('past-papers')
      .getPublicUrl(fileName)

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
      setTitle('')
      setYear('')
      setPaperType('')
      setFile(null)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin — Upload Past Paper</h1>
        <p className="text-gray-500 text-sm mb-6">Only you can see this page.</p>

        {message && (
          <div className={`p-3 rounded-lg text-sm mb-4 ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="bg-white border rounded-xl p-6 space-y-4">
          <select value={subject} onChange={e => setSubject(e.target.value)}
            className="w-full border rounded-lg p-3 text-sm text-gray-900 bg-white">
            <option value="">Select subject...</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <input
            type="text"
            placeholder="Title (e.g. May 2023 Paper 1 TZ1)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border rounded-lg p-3 text-sm text-gray-900"
          />

          <input
            type="number"
            placeholder="Year (e.g. 2023)"
            value={year}
            onChange={e => setYear(e.target.value)}
            className="w-full border rounded-lg p-3 text-sm text-gray-900"
          />

          <input
            type="text"
            placeholder="Paper type (e.g. Paper 1, Paper 2, Mark Scheme)"
            value={paperType}
            onChange={e => setPaperType(e.target.value)}
            className="w-full border rounded-lg p-3 text-sm text-gray-900"
          />

          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
            <input
              type="file"
              accept=".pdf"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="text-sm text-gray-600"
            />
            {file && <p className="text-xs text-green-600 mt-1">Selected: {file.name}</p>}
          </div>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload Paper'}
          </button>
        </div>
      </div>
    </div>
  )
}