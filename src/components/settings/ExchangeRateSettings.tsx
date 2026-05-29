'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw } from 'lucide-react'

interface RateResponse {
  rate: number
  source: 'api' | 'cache' | 'fallback'
  fetched_at: string
}

export function ExchangeRateSettings() {
  const [data, setData] = useState<RateResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [manualRate, setManualRate] = useState('')

  async function fetchRate() {
    setLoading(true)
    try {
      const res = await fetch('/api/exchange-rate')
      const json = (await res.json()) as RateResponse
      setData(json)
    } catch {
      setData({ rate: 0.175, source: 'fallback', fetched_at: new Date().toISOString() })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRate()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-sm font-medium">Current Rate</p>
          <p className="text-2xl font-bold">
            {data ? `1 MOP = ${data.rate} SGD` : '—'}
          </p>
          {data && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs capitalize">
                {data.source}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Last fetched:{' '}
                {new Date(data.fetched_at).toLocaleString('en-SG')}
              </span>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRate}
          disabled={loading}
        >
          <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="space-y-2 max-w-xs">
        <Label>Manual Override</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            step="0.0001"
            placeholder="e.g. 0.1750"
            value={manualRate}
            onChange={(e) => setManualRate(e.target.value)}
            className="w-40"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const r = parseFloat(manualRate)
              if (!isNaN(r)) {
                setData({
                  rate: r,
                  source: 'fallback',
                  fetched_at: new Date().toISOString(),
                })
              }
            }}
          >
            Apply
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Override is session-only. It will reset on page reload.
        </p>
      </div>
    </div>
  )
}
