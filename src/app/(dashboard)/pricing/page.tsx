'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { calcPrice, buildMarkupTable } from '@/lib/pricing'
import type { PricingResult } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/client'
import { calcBullBear } from '@/lib/pricing'
import type { BullBearResult } from '@/lib/pricing'
import type { Database } from '@/types/database'

type Crystal = Database['public']['Tables']['crystals']['Row']

const schema = z.object({
  costMop: z.number().min(0),
  markupPct: z.number().min(0).max(1000),
})

type FormValues = z.infer<typeof schema>

interface ExchangeRateResponse {
  rate: number
  source: 'api' | 'cache' | 'fallback'
  fetched_at: string
}

export default function PricingPage() {
  const [rate, setRate] = useState<ExchangeRateResponse | null>(null)
  const [result, setResult] = useState<PricingResult | null>(null)
  const [markupTable, setMarkupTable] = useState<Array<{ markupPct: number } & PricingResult>>([])
  const [crystals, setCrystals] = useState<Crystal[]>([])
  const [loadingCrystals, setLoadingCrystals] = useState(false)
  const [analysisRan, setAnalysisRan] = useState(false)
  const [bullBear, setBullBear] = useState<{
    bear: BullBearResult
    base: BullBearResult
    bull: BullBearResult
  } | null>(null)

  const { register, watch, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { costMop: 100, markupPct: 60 },
  })

  const costMop = watch('costMop')
  const markupPct = watch('markupPct')

  useEffect(() => {
    fetch('/api/exchange-rate')
      .then((r) => r.json())
      .then((data: ExchangeRateResponse) => setRate(data))
      .catch(() => setRate({ rate: 0.175, source: 'fallback', fetched_at: new Date().toISOString() }))
  }, [])

  const recalculate = useCallback(() => {
    if (!rate) return
    const config = { mopSgdRate: rate.rate, ccFeePct: 3.4, gstPct: 9 }
    const cost = Number(costMop) || 0
    const markup = Number(markupPct) || 0
    setResult(calcPrice(cost, markup, config))
    setMarkupTable(buildMarkupTable(cost, config))
  }, [rate, costMop, markupPct])

  useEffect(() => { recalculate() }, [recalculate])

  async function loadCrystals() {
    setLoadingCrystals(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.from('crystals').select('*')
      setCrystals((data ?? []) as Crystal[])
    } catch {
      setCrystals([])
    } finally {
      setLoadingCrystals(false)
    }
  }

  function runAnalysis() {
    if (!rate || crystals.length === 0) return
    const items = crystals
      .filter((c) => c.cost_price_mop != null)
      .map((c) => ({ costMop: c.cost_price_mop!, markupPct: c.markup_pct, quantity: 1 }))
    if (items.length === 0) return
    const analysis = calcBullBear({
      items,
      config: { mopSgdRate: rate.rate, ccFeePct: 3.4, gstPct: 9 },
    })
    setBullBear(analysis)
    setAnalysisRan(true)
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Pricing</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Calculate prices and run bull/bear scenarios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Pricing Calculator */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Calculator</CardTitle>
              {rate && (
                <p className="text-xs text-muted-foreground">
                  Live rate: 1 MOP = {rate.rate} SGD
                  <Badge variant="outline" className="ml-2 text-xs">{rate.source}</Badge>
                </p>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(recalculate)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cost (MOP)</Label>
                    <Input type="number" step="0.01" {...register('costMop')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Markup %</Label>
                    <Input type="number" step="1" {...register('markupPct')} />
                  </div>
                </div>
              </form>

              {result && (
                <div className="mt-6 space-y-3">
                  <Separator />
                  <div className="space-y-2">
                    {[
                      { label: 'Cost SGD', value: `S$${result.costSgd.toFixed(2)}` },
                      { label: 'Retail SGD', value: `S$${result.retailSgd.toFixed(2)}` },
                      { label: 'After CC fee (3.4%)', value: `S$${result.withCcSgd.toFixed(2)}` },
                      { label: 'Final w/ GST (9%)', value: `S$${result.finalSgd.toFixed(2)}`, bold: true },
                      { label: 'Your margin %', value: `${result.effectiveMarginPct.toFixed(1)}%`, bold: true },
                    ].map(({ label, value, bold }) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className={bold ? 'font-semibold' : ''}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {markupTable.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Markup Table (30–100%)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Markup %</TableHead>
                        <TableHead className="text-right">Cost SGD</TableHead>
                        <TableHead className="text-right">Retail SGD</TableHead>
                        <TableHead className="text-right">Final SGD</TableHead>
                        <TableHead className="text-right">Margin %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {markupTable.map((row) => {
                        const isSelected = Math.round(Number(markupPct)) === row.markupPct
                        return (
                          <TableRow key={row.markupPct} className={isSelected ? 'bg-[#C4956A]/10 font-semibold' : ''}>
                            <TableCell>{row.markupPct}%</TableCell>
                            <TableCell className="text-right">S${row.costSgd.toFixed(2)}</TableCell>
                            <TableCell className="text-right">S${row.retailSgd.toFixed(2)}</TableCell>
                            <TableCell className="text-right">S${row.finalSgd.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{row.effectiveMarginPct.toFixed(1)}%</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT: Bull/Bear Analysis */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bull / Bear Analysis</CardTitle>
              <p className="text-xs text-muted-foreground">
                Bull/Bear adjusts your set markups by ±20% to model discount vs premium scenarios.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={loadCrystals} variant="outline" disabled={loadingCrystals}>
                {loadingCrystals ? 'Loading…' : 'Load All Products'}
              </Button>

              {crystals.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {crystals.length} products loaded.{' '}
                    {crystals.filter((c) => c.cost_price_mop != null).length} with cost data.
                  </p>
                  <div className="max-h-48 overflow-y-auto rounded border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Cost (MOP)</TableHead>
                          <TableHead className="text-right">Markup %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {crystals.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="text-sm">{c.name}</TableCell>
                            <TableCell className="text-right text-sm">{c.cost_price_mop ?? '—'}</TableCell>
                            <TableCell className="text-right text-sm">{c.markup_pct}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button onClick={runAnalysis}>Run Analysis</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {analysisRan && bullBear && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Bear (–20%)</TableHead>
                      <TableHead className="text-right">Base</TableHead>
                      <TableHead className="text-right text-emerald-600">Bull (+20%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Revenue</TableCell>
                      <TableCell className="text-right">S${bullBear.bear.totalRevenueSgd.toFixed(2)}</TableCell>
                      <TableCell className="text-right">S${bullBear.base.totalRevenueSgd.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-emerald-600">S${bullBear.bull.totalRevenueSgd.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Cost</TableCell>
                      <TableCell className="text-right">S${bullBear.bear.totalCostSgd.toFixed(2)}</TableCell>
                      <TableCell className="text-right">S${bullBear.base.totalCostSgd.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-emerald-600">S${bullBear.bull.totalCostSgd.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Gross Profit</TableCell>
                      <TableCell className="text-right">S${bullBear.bear.grossProfitSgd.toFixed(2)}</TableCell>
                      <TableCell className="text-right">S${bullBear.base.grossProfitSgd.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-emerald-600">S${bullBear.bull.grossProfitSgd.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Margin %</TableCell>
                      <TableCell className="text-right">{bullBear.bear.grossMarginPct.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{bullBear.base.grossMarginPct.toFixed(1)}%</TableCell>
                      <TableCell className="text-right text-emerald-600">{bullBear.bull.grossMarginPct.toFixed(1)}%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
