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
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1600&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="bg-white/95 backdrop-blur-sm p-10 rounded-[2rem] shadow-2xl w-full max-w-md border border-white/20">
        
        <div className="text-center mb-8">
          <h1
            className="text-4xl font-normal text-slate-800 tracking-tight mb-1"
            style={{ fontFamily: '"Garamond", "EB Garamond", "Georgia", serif' }}
          >
            IB Study Tools
          </h1>
          <p className="text-slate-500 font-medium text-xs uppercase tracking-[0.15em]">
            {isLoginMode ? 'Academic Portal' : 'Create an Account'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl mb-6 text-[11px] font-bold text-center bg-red-50 text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-3">
          <input
            type="email"
            placeholder="Email address"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold shadow-md active:scale-[0.99] transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : (isLoginMode ? 'Sign In' : 'Register')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode)
              setError('')
            }}
            className="group flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
          >
            <span>{isLoginMode ? "No account? Sign up" : "Already registered? Sign in"}</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  )
}