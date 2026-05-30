'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

export function FeesAndTaxSettings() {
  const [ccFee, setCcFee] = useState('3.4')
  const [gst, setGst] = useState('9')
  const [gstEnabled, setGstEnabled] = useState(true)
  const [saved, setSaved] = useState(false)
  const { t } = useLanguage()

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label>{t('settings_cc_fee')}</Label>
        <Input type="number" step="0.1" value={ccFee} onChange={(e) => setCcFee(e.target.value)} className="w-36" />
        <p className="text-xs text-muted-foreground">{t('settings_cc_fee_hint')}</p>
      </div>

      <div className="space-y-2">
        <Label>{t('settings_gst')}</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            step="0.1"
            value={gst}
            onChange={(e) => setGst(e.target.value)}
            disabled={!gstEnabled}
            className="w-36"
          />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={gstEnabled} onChange={(e) => setGstEnabled(e.target.checked)} className="rounded" />
            {t('settings_enable_gst')}
          </label>
        </div>
      </div>

      <Button size="sm" onClick={handleSave}>
        {saved ? t('settings_saved') : t('settings_save')}
      </Button>
    </div>
  )
}
