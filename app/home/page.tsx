'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1
          className="font-bold text-lg text-blue-600"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          IB Study Tools
        </h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Logout
        </button>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <h2
          className="text-3xl font-bold text-gray-900 mb-2 text-center"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          What would you like to do?
        </h2>
        <p className="text-gray-500 text-sm mb-12 text-center">
          AI-powered tools built for IB Diploma Programme students
        </p>

        <div className="grid grid-cols-1 gap-6 w-full max-w-3xl sm:grid-cols-3">
          {/* Generate */}
          <button
            onClick={() => router.push('/generate')}
            className="group bg-white border rounded-2xl p-8 text-left hover:border-blue-400 hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-4">✏️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
              Generate
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Get essays, study notes, IA ideas, outlines, and revision help from your personal IB tutor.
            </p>
            <div className="mt-6 text-sm text-blue-600 font-medium group-hover:underline">
              Start chatting →
            </div>
          </button>

          {/* AI Check */}
          <button
            onClick={() => router.push('/ai-check')}
            className="group bg-white border rounded-2xl p-8 text-left hover:border-blue-400 hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
              AI Check
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Paste any text and find out how likely it is to have been AI-generated. Get a score from multiple detectors.
            </p>
            <div className="mt-6 text-sm text-blue-600 font-medium group-hover:underline">
              Check text →
            </div>
          </button>

          {/* Humanize */}
          <button
            onClick={() => router.push('/humanize')}
            className="group bg-white border rounded-2xl p-8 text-left hover:border-blue-400 hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-4">🪄</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
              Humanize
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Rewrite AI-generated text to sound natural and genuine. Choose from 5 writing styles.
            </p>
            <div className="mt-6 text-sm text-blue-600 font-medium group-hover:underline">
              Rewrite text →
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}