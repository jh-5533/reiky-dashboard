'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/contexts/LanguageContext'

export function PricingDefaultsSettings() {
  const [defaultMarkup, setDefaultMarkup] = useState('60')
  const [saved, setSaved] = useState(false)
  const { t } = useLanguage()

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label>{t('settings_default_markup')}</Label>
        <Input type="number" step="1" value={defaultMarkup} onChange={(e) => setDefaultMarkup(e.target.value)} className="w-36" />
        <p className="text-xs text-muted-foreground">{t('settings_default_markup_hint')}</p>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>{t('settings_bundle_discount')}</Label>
        <Input value="10" disabled className="w-36 bg-muted" />
        <p className="text-xs text-muted-foreground">{t('settings_bundle_hint')}</p>
      </div>

      <Button size="sm" onClick={handleSave}>
        {saved ? t('settings_saved') : t('settings_save')}
      </Button>
    </div>
  )
}
