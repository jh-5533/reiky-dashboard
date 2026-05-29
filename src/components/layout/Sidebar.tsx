'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Sparkles,
  Calculator,
  ShoppingBag,
  Users,
  Link2,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/',             icon: LayoutDashboard, label: 'Overview',     exact: true  },
  { href: '/products',     icon: Package,         label: 'Products',     exact: false },
  { href: '/services',     icon: Sparkles,        label: 'Services',     exact: false },
  { href: '/pricing',      icon: Calculator,      label: 'Pricing',      exact: false },
  { href: '/orders',       icon: ShoppingBag,     label: 'Orders',       exact: false },
  { href: '/customers',    icon: Users,           label: 'Customers',    exact: false },
  { href: '/secret-links', icon: Link2,           label: 'Secret Links', exact: false },
  { href: '/settings',     icon: Settings,        label: 'Settings',     exact: false },
]

export function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col z-20 bg-white border-r border-[#e8e8e8]">
      {/* Wordmark */}
      <div className="px-6 py-5 border-b border-[#e8e8e8]">
        <span className="text-base font-semibold tracking-wide text-[#1677ff]">
          Reiky SG
        </span>
        <p className="text-[11px] text-gray-400 mt-0.5 tracking-wide">Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-[#e6f4ff] text-[#1677ff] font-medium'
                  : 'text-[#595959] hover:bg-[#f5f5f5] hover:text-[#1d1d1d]'
              )}
            >
              <Icon
                size={16}
                className={active ? 'text-[#1677ff]' : 'text-[#8c8c8c]'}
              />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
