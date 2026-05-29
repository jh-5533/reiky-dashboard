import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ServiceForm } from '@/components/services/ServiceForm'

export default function NewServicePage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/services"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} />
          Services
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Service</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Create a new service listing.</p>
        </div>
      </div>

      <ServiceForm />
    </div>
  )
}
