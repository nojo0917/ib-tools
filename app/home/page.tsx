'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 dark:text-white dark:bg-gradient-to-br dark:from-[#0f172a] dark:via-[#1e3a5f] dark:to-[#0f172a] transition-colors duration-300">
      
      {/* Background Pattern: Visible as light gray on white, and white dots on dark */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-100"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <nav className="relative z-10 px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-none">
        <h1
          className="font-bold text-xl text-blue-600 dark:text-white"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          IB Study Tools
        </h1>
        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            className="text-sm text-gray-600 dark:text-blue-300 hover:text-blue-600 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-500 dark:text-blue-300 dark:hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="mb-3 text-blue-600 dark:text-blue-400 text-sm font-bold tracking-widest uppercase">
          IB Diploma Programme
        </div>
        <h2
          className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 text-center leading-tight"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Your AI Study Tutor
        </h2>
        <p className="text-gray-600 dark:text-blue-100 text-base mb-14 text-center max-w-md leading-relaxed">
          Three powerful tools to help you study smarter, write better, and understand deeper.
        </p>

        <div className="grid grid-cols-1 gap-6 w-full max-w-4xl sm:grid-cols-3">
          {/* Generate */}
          <button
            onClick={() => router.push('/generate')}
            className="group bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-7 text-left hover:shadow-2xl dark:hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="text-3xl mb-4">✏️</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
              Generate
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Essays, study notes, IA ideas, outlines, and revision help from your personal IB tutor.
            </p>
            <div className="mt-6 text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform inline-flex items-center">
              Start chatting <span className="ml-1">→</span>
            </div>
          </button>

          {/* AI Check */}
          <button
            onClick={() => router.push('/ai-check')}
            className="group bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-7 text-left hover:shadow-2xl dark:hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
              AI Check
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Find out how likely any text is to be AI-generated with scores from multiple detectors.
            </p>
            <div className="mt-6 text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform inline-flex items-center">
              Check text <span className="ml-1">→</span>
            </div>
          </button>

          {/* Humanize */}
          <button
            onClick={() => router.push('/humanize')}
            className="group bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-7 text-left hover:shadow-2xl dark:hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="text-3xl mb-4">🪄</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
              Humanize
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Rewrite AI text to sound natural and genuine. Choose from 5 different writing styles.
            </p>
            <div className="mt-6 text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform inline-flex items-center">
              Rewrite text <span className="ml-1">→</span>
            </div>
          </button>
        </div>

        <p className="mt-16 text-[10px] text-gray-400 dark:text-blue-300/50 uppercase tracking-[0.2em] font-medium text-center">
          For all IB students · Powered by AI
        </p>
      </div>
    </div>
  )
}