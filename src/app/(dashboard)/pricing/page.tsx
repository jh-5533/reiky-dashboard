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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { calcPrice, buildMarkupTable } from '@/lib/pricing'
import type { PricingResult } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/client'
import { calcBullBear } from '@/lib/pricing'
import type { BullBearResult } from '@/lib/pricing'
import { useLanguage } from '@/contexts/LanguageContext'
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
  const [bullBear, setBullBear] = useState<{ bear: BullBearResult; base: BullBearResult; bull: BullBearResult } | null>(null)
  const { t } = useLanguage()

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
    } catch { setCrystals([]) } finally { setLoadingCrystals(false) }
  }

  function runAnalysis() {
    if (!rate || crystals.length === 0) return
    const items = crystals
      .filter((c) => c.cost_price_mop != null)
      .map((c) => ({ costMop: c.cost_price_mop!, markupPct: c.markup_pct, quantity: 1 }))
    if (items.length === 0) return
    setBullBear(calcBullBear({ items, config: { mopSgdRate: rate.rate, ccFeePct: 3.4, gstPct: 9 } }))
    setAnalysisRan(true)
  }

  const resultRows: Array<{ key: 'pricing_cost_sgd' | 'pricing_retail_sgd' | 'pricing_after_cc' | 'pricing_final_gst' | 'pricing_margin'; value: string; bold: boolean }> = result ? [
    { key: 'pricing_cost_sgd',  value: `S$${result.costSgd.toFixed(2)}`,                bold: false },
    { key: 'pricing_retail_sgd', value: `S$${result.retailSgd.toFixed(2)}`,             bold: false },
    { key: 'pricing_after_cc',  value: `S$${result.withCcSgd.toFixed(2)}`,              bold: false },
    { key: 'pricing_final_gst', value: `S$${result.finalSgd.toFixed(2)}`,               bold: true  },
    { key: 'pricing_margin',    value: `${result.effectiveMarginPct.toFixed(1)}%`,       bold: true  },
  ] : []

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t('pricing_title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('pricing_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('pricing_calculator')}</CardTitle>
              {rate && (
                <p className="text-xs text-muted-foreground">
                  1 MOP = {rate.rate} SGD
                  <Badge variant="outline" className="ml-2 text-xs">{rate.source}</Badge>
                </p>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(recalculate)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('pricing_cost_mop')}</Label>
                    <Input type="number" step="0.01" {...register('costMop')} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('pricing_markup')}</Label>
                    <Input type="number" step="1" {...register('markupPct')} />
                  </div>
                </div>
              </form>

              {result && (
                <div className="mt-6 space-y-3">
                  <Separator />
                  <div className="space-y-2">
                    {resultRows.map(({ key, value, bold }) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t(key)}</span>
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
                <CardTitle className="text-base">{t('pricing_markup_table')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('pricing_markup')}</TableHead>
                        <TableHead className="text-right">{t('pricing_cost_sgd')}</TableHead>
                        <TableHead className="text-right">{t('pricing_retail_sgd')}</TableHead>
                        <TableHead className="text-right">{t('pricing_col_final')}</TableHead>
                        <TableHead className="text-right">{t('pricing_col_margin')}</TableHead>
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('pricing_bull_bear')}</CardTitle>
              <p className="text-xs text-muted-foreground">{t('pricing_bull_bear_desc')}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={loadCrystals} variant="outline" disabled={loadingCrystals}>
                {loadingCrystals ? t('pricing_loading') : t('pricing_load_products')}
              </Button>

              {crystals.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {crystals.length} {t('pricing_title').toLowerCase()}.{' '}
                    {crystals.filter((c) => c.cost_price_mop != null).length} with cost data.
                  </p>
                  <div className="max-h-48 overflow-y-auto rounded border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('pricing_product')}</TableHead>
                          <TableHead className="text-right">{t('pricing_cost_mop')}</TableHead>
                          <TableHead className="text-right">{t('pricing_markup')}</TableHead>
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
                  <Button onClick={runAnalysis}>{t('pricing_run_analysis')}</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {analysisRan && bullBear && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('pricing_analysis_results')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('overview_metric')}</TableHead>
                      <TableHead className="text-right">{t('overview_bear')}</TableHead>
                      <TableHead className="text-right">{t('overview_base')}</TableHead>
                      <TableHead className="text-right text-pink-600">{t('overview_bull')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {([
                      ['pricing_revenue', 'totalRevenueSgd'],
                      ['overview_cost',   'totalCostSgd'],
                      ['overview_gross_profit', 'grossProfitSgd'],
                    ] as const).map(([labelKey, field]) => (
                      <TableRow key={labelKey}>
                        <TableCell>{t(labelKey)}</TableCell>
                        <TableCell className="text-right">S${(bullBear.bear as any)[field].toFixed(2)}</TableCell>
                        <TableCell className="text-right">S${(bullBear.base as any)[field].toFixed(2)}</TableCell>
                        <TableCell className="text-right text-pink-600">S${(bullBear.bull as any)[field].toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell>{t('overview_margin')}</TableCell>
                      <TableCell className="text-right">{bullBear.bear.grossMarginPct.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{bullBear.base.grossMarginPct.toFixed(1)}%</TableCell>
                      <TableCell className="text-right text-pink-600">{bullBear.bull.grossMarginPct.toFixed(1)}%</TableCell>
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
