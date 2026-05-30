import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ExchangeRateSettings } from '@/components/settings/ExchangeRateSettings'
import { FeesAndTaxSettings } from '@/components/settings/FeesAndTaxSettings'
import { PricingDefaultsSettings } from '@/components/settings/PricingDefaultsSettings'
import { UsersSettings } from '@/components/settings/UsersSettings'
import { getLang, t } from '@/lib/i18n/server'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export default async function SettingsPage() {
  let profiles: Profile[] = []
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    profiles = data ?? []
  } catch { profiles = [] }

  const lang = await getLang()

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t(lang, 'settings_title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t(lang, 'settings_subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t(lang, 'settings_exchange_rate')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t(lang, 'settings_exchange_desc')}</p>
        </CardHeader>
        <CardContent><ExchangeRateSettings /></CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader><CardTitle>{t(lang, 'settings_fees_tax')}</CardTitle></CardHeader>
        <CardContent><FeesAndTaxSettings /></CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader><CardTitle>{t(lang, 'settings_pricing_defaults')}</CardTitle></CardHeader>
        <CardContent><PricingDefaultsSettings /></CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>{t(lang, 'settings_users')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t(lang, 'settings_users_desc')}</p>
        </CardHeader>
        <CardContent><UsersSettings profiles={profiles} /></CardContent>
      </Card>
    </div>
  )
}
