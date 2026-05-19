'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import './profile.css'

const NAV = [
  {
    label: 'Account',
    items: [
      { href: '/profile', icon: 'ti-user', label: 'Profile' },
      { href: '/profile/stats', icon: 'ti-chart-bar', label: 'My Stats' },
      { href: '/profile/study', icon: 'ti-books', label: 'Study Preferences' },
    ],
  },
  {
    label: 'Security',
    items: [
      { href: '/profile/security', icon: 'ti-shield-check', label: 'Password' },
      { href: '/profile/sessions', icon: 'ti-devices', label: 'Sessions' },
      { href: '/profile/notifications', icon: 'ti-bell', label: 'Notifications', badge: true },
    ],
  },
  {
    label: 'App',
    items: [
      { href: '/profile/appearance', icon: 'ti-palette', label: 'Appearance' },
      { href: '/profile/danger', icon: 'ti-alert-triangle', label: 'Danger Zone' },
    ],
  },
]

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [supabase])

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? 'IB'

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'IB Student'

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="profile-shell">
      <aside className="profile-sidebar">
        <div className="sidebar-header">
          <div className="avatar-row">
            <div className="avatar-circle">{initials}</div>
            <div>
              <p className="avatar-name">{displayName}</p>
              <p className="avatar-role">IB Student</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((group) => (
            <div key={group.label} className="nav-group">
              <p className="nav-group-label">{group.label}</p>
              {group.items.map((item) => {
                const active =
                  item.href === '/profile' ? pathname === '/profile' : pathname.startsWith(item.href)
                return (
                  <Link key={item.href} href={item.href} className={`nav-item${active ? ' active' : ''}`}>
                    <i className={`ti ${item.icon}`} aria-hidden="true" />
                    {item.label}
                    {item.badge && <span className="nav-badge" />}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {/* Fixed Exit Button: Uses <a> tag to force page reload and clear CSS */}
          <a 
            href="/home" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px', 
              width: '100%', 
              padding: '10px', 
              backgroundColor: '#e2e8f0', 
              color: '#0f172a', 
              borderRadius: '6px', 
              fontWeight: '600',
              marginBottom: '16px',
              textDecoration: 'none',
              border: '1px solid #cbd5e1'
            }}
          >
            <i className="ti ti-arrow-left" aria-hidden="true" />
            Back to Home
          </a>

          <button className="logout-btn" onClick={handleSignOut}>
            <i className="ti ti-logout" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="profile-main">{children}</main>
    </div>
  )
}