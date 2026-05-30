import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Edit } from 'lucide-react'
import { getLang, t } from '@/lib/i18n/server'
import type { Database } from '@/types/database'

type Service = Database['public']['Tables']['services']['Row']

function ServiceStatusBadge({ status, lang }: { status: Service['status']; lang: 'en' | 'zh' }) {
  if (status === 'published')
    return <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-100">{t(lang, 'status_published')}</Badge>
  if (status === 'secret')
    return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">{t(lang, 'status_secret')}</Badge>
  return <Badge variant="secondary">{t(lang, 'status_draft')}</Badge>
}

function formatPrice(service: Service): string {
  if (service.price_sgd != null) return `S$${service.price_sgd.toFixed(2)}`
  if (Array.isArray(service.tiers) && service.tiers.length > 0) {
    return `${service.tiers.length} tiers`
  }
  return '—'
}

export default async function ServicesPage() {
  let services: Service[] = []
  const lang = await getLang()

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false })
    services = data ?? []
  } catch {
    services = []
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t(lang, 'services_title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t(lang, 'services_subtitle')}
          </p>
        </div>
        <Link href="/services/new">
          <Button>{t(lang, 'services_new')}</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t(lang, 'services_all')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t(lang, 'services_col_name')}</TableHead>
                <TableHead>{t(lang, 'services_col_category')}</TableHead>
                <TableHead>{t(lang, 'services_col_status')}</TableHead>
                <TableHead className="text-right">{t(lang, 'services_col_price')}</TableHead>
                <TableHead className="w-20">{t(lang, 'services_col_actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="capitalize text-muted-foreground text-sm">
                    {service.category ?? '—'}
                  </TableCell>
                  <TableCell>
                    <ServiceStatusBadge status={service.status} lang={lang} />
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatPrice(service)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/services/${service.id}`}>
                      <Button size="sm" variant="outline">
                        <Edit size={14} className="mr-1" />
                        {t(lang, 'services_edit')}
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {services.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    {t(lang, 'services_empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
