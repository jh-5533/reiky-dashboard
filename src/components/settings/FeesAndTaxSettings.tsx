'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function FeesAndTaxSettings() {
  const [ccFee, setCcFee] = useState('3.4')
  const [gst, setGst] = useState('9')
  const [gstEnabled, setGstEnabled] = useState(true)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    // In production, persist to settings table
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label>Credit Card Fee (%)</Label>
        <Input
          type="number"
          step="0.1"
          value={ccFee}
          onChange={(e) => setCcFee(e.target.value)}
          className="w-36"
        />
        <p className="text-xs text-muted-foreground">
          Applied as pass-through: price / (1 - fee%)
        </p>
      </div>

      <div className="space-y-2">
        <Label>GST (%)</Label>
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
            <input
              type="checkbox"
              checked={gstEnabled}
              onChange={(e) => setGstEnabled(e.target.checked)}
              className="rounded"
            />
            Enable GST
          </label>
        </div>
      </div>

      <Button size="sm" onClick={handleSave}>
        {saved ? 'Saved!' : 'Save'}
      </Button>
    </div>
  )
}
