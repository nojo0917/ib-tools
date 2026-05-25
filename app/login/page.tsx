'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLoginMode, setIsLoginMode] = useState(true) // Toggle state
  
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isLoginMode) {
      // Sign In Logic
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        router.push('/home')
      }
    } else {
      // Sign Up Logic
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/generate`
        }
      })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setError('Account created! Please check your email or sign in.')
        setLoading(false)
        setIsLoginMode(true) // Switch back to login after success
      }
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.8)), url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1600&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="bg-white dark:bg-[#0f172a] p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800">
        <div className="text-center mb-8">
          <h1
            className="text-4xl font-bold mb-2 text-blue-600 dark:text-white"
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '-1px' }}
          >
            IB Study Tools
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
            {isLoginMode ? 'Welcome back, scholar.' : 'Join the community for free.'}
          </p>
        </div>

        {error && (
          <div className={`p-4 rounded-2xl mb-6 text-xs font-bold text-center ${
            error.includes('created') 
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' 
              : 'bg-red-50 text-red-600 dark:bg-red-900/20'
          }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 dark:bg-blue-600 text-white rounded-2xl py-4 font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : (isLoginMode ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode)
              setError('')
            }}
            className="group flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            {isLoginMode ? "No account? Create one" : "Already have an account? Sign in"}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  )
}