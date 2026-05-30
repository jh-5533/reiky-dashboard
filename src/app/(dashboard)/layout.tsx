import { Sidebar } from '@/components/layout/Sidebar'
import { LanguageProvider } from '@/contexts/LanguageContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LanguageProvider>
      <div className="min-h-screen flex bg-[#f5f5f5]">
        <Sidebar />
        <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
          {children}
        </main>
      </div>
    </LanguageProvider>
  )
}
