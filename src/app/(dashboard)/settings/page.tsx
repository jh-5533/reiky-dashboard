import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ExchangeRateSettings } from '@/components/settings/ExchangeRateSettings'
import { FeesAndTaxSettings } from '@/components/settings/FeesAndTaxSettings'
import { PricingDefaultsSettings } from '@/components/settings/PricingDefaultsSettings'
import { UsersSettings } from '@/components/settings/UsersSettings'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export default async function SettingsPage() {
  let profiles: Profile[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    profiles = data ?? []
  } catch {
    profiles = []
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure your dashboard preferences.
        </p>
      </div>

      {/* Exchange Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Live Exchange Rate</CardTitle>
          <p className="text-sm text-muted-foreground">
            MOP → SGD rate used for all pricing calculations.
          </p>
        </CardHeader>
        <CardContent>
          <ExchangeRateSettings />
        </CardContent>
      </Card>

      <Separator />

      {/* Fees & Tax */}
      <Card>
        <CardHeader>
          <CardTitle>Fees &amp; Tax</CardTitle>
        </CardHeader>
        <CardContent>
          <FeesAndTaxSettings />
        </CardContent>
      </Card>

      <Separator />

      {/* Pricing defaults */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Defaults</CardTitle>
        </CardHeader>
        <CardContent>
          <PricingDefaultsSettings />
        </CardContent>
      </Card>

      <Separator />

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage staff and admin access.
          </p>
        </CardHeader>
        <CardContent>
          <UsersSettings profiles={profiles} />
        </CardContent>
      </Card>
    </div>
  )
}
