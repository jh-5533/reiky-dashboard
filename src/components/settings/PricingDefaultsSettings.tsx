'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function PricingDefaultsSettings() {
  const [defaultMarkup, setDefaultMarkup] = useState('60')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label>Default Markup %</Label>
        <Input
          type="number"
          step="1"
          value={defaultMarkup}
          onChange={(e) => setDefaultMarkup(e.target.value)}
          className="w-36"
        />
        <p className="text-xs text-muted-foreground">
          Applied to new products as the starting markup.
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Bundle Discount %</Label>
        <Input
          value="10"
          disabled
          className="w-36 bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Fixed at 10%. Automatically applied when customers purchase bundles.
          Contact engineering to change this value.
        </p>
      </div>

      <Button size="sm" onClick={handleSave}>
        {saved ? 'Saved!' : 'Save'}
      </Button>
    </div>
  )
}
