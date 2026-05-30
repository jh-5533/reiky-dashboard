import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft } from 'lucide-react'
import { ServiceForm } from '@/components/services/ServiceForm'
import { DeleteServiceButton } from '@/components/services/DeleteServiceButton'
import { CopySecretLinkButton } from '@/components/products/CopySecretLinkButton'
import { getLang, t } from '@/lib/i18n/server'
import type { Database } from '@/types/database'

type Service = Database['public']['Tables']['services']['Row']

export default async function EditServicePage({
  params: rawParams,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }, lang] = await Promise.all([rawParams, getLang()])
  const supabase = await createClient()

  const { data } = await supabase.from('services').select('*').eq('id', id).single()
  if (!data) notFound()
  const service = data as Service

  const secretLinkUrl = service.secret_token
    ? `https://reiky-website.vercel.app/crystals/product.html?secret=${service.secret_token}`
    : null

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/services"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={16} />
            {t(lang, 'common_back_services')}
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{service.name}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{t(lang, 'services_edit_subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {secretLinkUrl && <CopySecretLinkButton url={secretLinkUrl} />}
          <DeleteServiceButton id={service.id} name={service.name} />
        </div>
      </div>

      <ServiceForm service={service} />
    </div>
  )
}
