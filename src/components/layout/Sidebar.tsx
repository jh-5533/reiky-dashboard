'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, Sparkles, Calculator,
  ShoppingBag, Users, Link2, Settings, Languages,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { lang, setLang, t } = useLanguage()

  const navItems = [
    { href: '/',             icon: LayoutDashboard, labelKey: 'nav_overview',      exact: true  },
    { href: '/products',     icon: Package,         labelKey: 'nav_products',      exact: false },
    { href: '/services',     icon: Sparkles,        labelKey: 'nav_services',      exact: false },
    { href: '/pricing',      icon: Calculator,      labelKey: 'nav_pricing',       exact: false },
    { href: '/orders',       icon: ShoppingBag,     labelKey: 'nav_orders',        exact: false },
    { href: '/customers',    icon: Users,           labelKey: 'nav_customers',     exact: false },
    { href: '/secret-links', icon: Link2,           labelKey: 'nav_secret_links',  exact: false },
    { href: '/settings',     icon: Settings,        labelKey: 'nav_settings',      exact: false },
  ] as const

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  function toggleLang() {
    setLang(lang === 'en' ? 'zh' : 'en')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col z-20 bg-white border-r border-[#e8e8e8]">
      <div className="px-6 py-5 border-b border-[#e8e8e8]">
        <span className="text-base font-semibold tracking-wide text-primary">Reiky SG</span>
        <p className="text-[11px] text-gray-400 mt-0.5 tracking-wide">{t('nav_dashboard')}</p>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, labelKey, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-accent text-primary font-medium'
                  : 'text-[#595959] hover:bg-[#f5f5f5] hover:text-[#1d1d1d]'
              )}
            >
              <Icon size={16} className={active ? 'text-primary' : 'text-[#8c8c8c]'} />
              <span>{t(labelKey)}</span>
            </Link>
          )
        })}
      </nav>

      {/* Language toggle */}
      <div className="px-2 pb-4 border-t border-[#e8e8e8] pt-3">
        <button
          onClick={toggleLang}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm text-[#595959] hover:bg-[#f5f5f5] hover:text-[#1d1d1d] transition-colors"
        >
          <Languages size={16} className="text-[#8c8c8c]" />
          <span>{lang === 'en' ? '中文' : 'English'}</span>
        </button>
      </div>
    </aside>
  )
}
