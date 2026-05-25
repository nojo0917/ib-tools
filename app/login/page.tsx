'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowRight, GraduationCap } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLoginMode, setIsLoginMode] = useState(true)
  
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isLoginMode) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        router.push('/home')
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/generate` }
      })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setError('Verification email sent! Check your inbox.')
        setLoading(false)
        setIsLoginMode(true)
      }
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundColor: '#0f172a',
        backgroundImage: `radial-gradient(circle at 0% 0%, rgba(37, 99, 235, 0.15) 0%, transparent 50%), 
                          radial-gradient(circle at 100% 100%, rgba(37, 99, 235, 0.1) 0%, transparent 50%),
                          url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1600&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay'
      }}
    >
      {/* Soft Background Overlay for better text legibility */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />

      <div className="relative w-full max-w-md">
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 dark:border-slate-800">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
              <GraduationCap className="text-white" size={32} />
            </div>
            <h1
              className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              IB Study Tools
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
              {isLoginMode ? 'Sign in to your dashboard' : 'Join thousands of IB students'}
            </p>
          </div>

          {error && (
            <div className={`p-4 rounded-xl mb-6 text-xs font-bold text-center animate-in fade-in slide-in-from-top-2 duration-300 ${
              error.includes('sent') 
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
            }`}>
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="group">
              <input
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-600 rounded-2xl p-4 text-sm text-slate-900 dark:text-white focus:outline-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div className="group">
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-600 rounded-2xl p-4 text-sm text-slate-900 dark:text-white focus:outline-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-2xl py-4 font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isLoginMode ? 'Sign In' : 'Create Free Account'
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800/50">
            <button
              onClick={() => {
                setIsLoginMode(!isLoginMode)
                setError('')
              }}
              className="w-full group flex items-center justify-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <span>{isLoginMode ? "No account? Create one" : "Already have an account? Sign in"}</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Subtle Footer */}
        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400/60">
          The Premium IB Resource Engine
        </p>
      </div>
    </div>
  )
}