import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { SecretLinksClient } from '@/components/secret-links/SecretLinksClient'
import { getLang, t } from '@/lib/i18n/server'
import type { Database } from '@/types/database'

type SecretLink = Database['public']['Tables']['secret_links']['Row']
type Lang = 'en' | 'zh'

function LinkStatusBadge({ link, lang }: { link: SecretLink; lang: Lang }) {
  if (!link.is_active) return <Badge variant="secondary">{t(lang, 'secret_links_status_inactive')}</Badge>
  if (link.expires_at && new Date(link.expires_at) < new Date()) return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{t(lang, 'secret_links_status_expired')}</Badge>
  if (link.max_uses != null && link.use_count >= link.max_uses) return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">{t(lang, 'secret_links_status_used_up')}</Badge>
  return <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-100">{t(lang, 'secret_links_status_active')}</Badge>
}

async function getLinksWithProducts() {
  try {
    const supabase = await createClient()
    const { data: links } = await supabase.from('secret_links').select('*').order('created_at', { ascending: false })

    const crystalIds = [...new Set((links ?? []).filter((l) => l.crystal_id).map((l) => l.crystal_id!))]
    const serviceIds = [...new Set((links ?? []).filter((l) => l.service_id).map((l) => l.service_id!))]

    const [crystalsRes, servicesRes] = await Promise.all([
      crystalIds.length > 0 ? supabase.from('crystals').select('id, name').in('id', crystalIds) : Promise.resolve({ data: [] }),
      serviceIds.length > 0 ? supabase.from('services').select('id, name').in('id', serviceIds) : Promise.resolve({ data: [] }),
    ])

    const crystalMap = new Map((crystalsRes.data ?? []).map((c) => [c.id, c.name]))
    const serviceMap = new Map((servicesRes.data ?? []).map((s) => [s.id, s.name]))
    return { links: links ?? [], crystalMap, serviceMap }
  } catch {
    return { links: [], crystalMap: new Map(), serviceMap: new Map() }
  }
}

export default async function SecretLinksPage() {
  const [{ links, crystalMap, serviceMap }, lang] = await Promise.all([getLinksWithProducts(), getLang()])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t(lang, 'secret_links_title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t(lang, 'secret_links_subtitle')}</p>
        </div>
        <SecretLinksClient mode="button" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t(lang, 'secret_links_all')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t(lang, 'secret_links_col_label')}</TableHead>
                <TableHead>{t(lang, 'secret_links_col_product')}</TableHead>
                <TableHead>{t(lang, 'secret_links_col_token')}</TableHead>
                <TableHead>{t(lang, 'secret_links_col_expires')}</TableHead>
                <TableHead className="text-right">{t(lang, 'secret_links_col_uses')}</TableHead>
                <TableHead>{t(lang, 'secret_links_col_status')}</TableHead>
                <TableHead className="w-28">{t(lang, 'secret_links_col_actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => {
                const productName = link.crystal_id
                  ? crystalMap.get(link.crystal_id)
                  : link.service_id ? serviceMap.get(link.service_id) : null
                const url = `https://reiky-website.vercel.app/crystals/product.html?secret=${link.token}`

                return (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.label ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{productName ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{link.token.slice(0, 12)}…</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {link.expires_at ? new Date(link.expires_at).toLocaleDateString('en-SG') : '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {link.use_count}{link.max_uses != null ? ` / ${link.max_uses}` : ''}
                    </TableCell>
                    <TableCell><LinkStatusBadge link={link} lang={lang} /></TableCell>
                    <TableCell><SecretLinksClient mode="copy" url={url} /></TableCell>
                  </TableRow>
                )
              })}
              {links.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {t(lang, 'secret_links_empty')}
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
