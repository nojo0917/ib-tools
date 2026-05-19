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
      
      {/* Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.15] dark:opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <nav className="relative z-10 px-6 py-4 flex justify-between items-center border-b border-gray-200 dark:border-white/5 bg-white/50 dark:bg-transparent backdrop-blur-sm">
        <h1
          className="font-bold text-xl text-blue-600 dark:text-white"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          IB Study Tools
        </h1>
        <div className="flex items-center gap-6 font-medium">
          <Link
            href="/profile"
            className="text-sm text-gray-600 dark:text-blue-200 hover:text-blue-600 dark:hover:text-white transition-colors flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 dark:text-blue-200/70 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="mb-4 text-blue-600 dark:text-blue-400 text-xs font-black tracking-[0.3em] uppercase bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">
          IB Diploma Programme
        </div>
        <h2
          className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-4 text-center leading-tight tracking-tight"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Your AI Study Tutor
        </h2>
        <p className="text-gray-600 dark:text-blue-100/80 text-lg mb-16 text-center max-w-xl leading-relaxed">
          Three powerful tools designed to help you study smarter, <br className="hidden sm:block" /> write better, and understand deeper.
        </p>

        <div className="grid grid-cols-1 gap-8 w-full max-w-5xl sm:grid-cols-3">
          
          {[
            { 
              title: 'Generate', 
              emoji: '✏️', 
              desc: 'Essays, study notes, IA ideas, outlines, and revision help from your personal IB tutor.',
              link: '/generate',
              cta: 'Start chatting'
            },
            { 
              title: 'AI Check', 
              emoji: '🔍', 
              desc: 'Find out how likely any text is to be AI-generated with scores from multiple detectors.',
              link: '/ai-check',
              cta: 'Check text'
            },
            { 
              title: 'Humanize', 
              emoji: '🪄', 
              desc: 'Rewrite AI text to sound natural and genuine. Choose from 5 different writing styles.',
              link: '/humanize',
              cta: 'Rewrite text'
            }
          ].map((card) => (
            <button
              key={card.title}
              onClick={() => router.push(card.link)}
              /* FIX: Increased border from gray-100 to gray-300 for visibility.
                 Added a darker md shadow for a more defined card depth.
              */
              className="group relative bg-white dark:bg-white/[0.03] border-2 border-gray-300 dark:border-white/10 rounded-[2rem] p-8 text-left shadow-md dark:shadow-none hover:shadow-2xl dark:hover:bg-white/[0.07] dark:hover:border-white/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
            >
              {/* Card Hover Glow */}
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />
              
              <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-500">{card.emoji}</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {card.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                {card.desc}
              </p>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                {card.cta} <span>→</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-20 flex flex-col items-center gap-4">
          <div className="h-px w-20 bg-gray-300 dark:bg-white/10" />
          <p className="text-[10px] text-gray-400 dark:text-blue-300/40 uppercase tracking-[0.4em] font-bold text-center">
            Empowering IB Students Worldwide
          </p>
        </div>
      </div>
    </div>
  )
}