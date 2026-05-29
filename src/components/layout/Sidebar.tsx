'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Sparkles,
  Calculator,
  ShoppingBag,
  Users,
  Link2,
  Settings,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Overview', exact: true },
  { href: '/products', icon: Package, label: 'Products', exact: false },
  { href: '/services', icon: Sparkles, label: 'Services', exact: false },
  { href: '/pricing', icon: Calculator, label: 'Pricing', exact: false },
  { href: '/orders', icon: ShoppingBag, label: 'Orders', exact: false },
  { href: '/customers', icon: Users, label: 'Customers', exact: false },
  { href: '/secret-links', icon: Link2, label: 'Secret Links', exact: false },
  { href: '/settings', icon: Settings, label: 'Settings', exact: false },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 flex flex-col z-20"
      style={{ backgroundColor: '#1d1c1a' }}
    >
      {/* Wordmark */}
      <div className="px-6 py-6 border-b border-white/10">
        <span
          className="text-xl font-bold tracking-widest uppercase"
          style={{ color: '#C4956A' }}
        >
          Reiky SG
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
              style={active ? { backgroundColor: '#C4956A22' } : undefined}
            >
              <Icon
                size={18}
                className={active ? 'text-[#C4956A]' : 'text-white/50'}
              />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut size={18} className="text-white/50" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
