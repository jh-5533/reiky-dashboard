'use client'

import { useFieldArray, useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Trash2, Plus } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props {
  rate: number
}

export function VariantPricingTable({ rate }: Props) {
  const { control, register, watch } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name: 'variants' })
  const { t } = useLanguage()

  const variants = watch('variants') as Array<{
    bead_size_mm: string
    bead_size_mm_max: string
    cost_price_mop: string
    reiky_cost_mop: string
    sell_price_sgd: string
  }>

  const CC_FEE = 0.034
  const GST = 0.09

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Col 1 */}
              <TableHead className="w-20 whitespace-nowrap">{t('vpt_size')}</TableHead>

              {/* Col 2 */}
              <TableHead className="whitespace-nowrap">
                {t('vpt_supplier_cost')}
                <br />
                <span className="text-xs font-normal text-muted-foreground">{t('vpt_mop_customs')}</span>
              </TableHead>

              {/* Col 3 */}
              <TableHead className="text-center whitespace-nowrap">
                {t('vpt_import_gst')}
                <br />
                <span className="text-xs font-normal text-muted-foreground">{t('vpt_customs_total')}</span>
              </TableHead>

              {/* Col 4 */}
              <TableHead className="whitespace-nowrap">
                {t('vpt_reiky_cost')}
                <br />
                <span className="text-xs font-normal text-muted-foreground">{t('vpt_macau_price')}</span>
              </TableHead>

              {/* Col 5 */}
              <TableHead className="text-right whitespace-nowrap">
                {t('vpt_sg_sell_price')}
                <br />
                <span className="text-xs font-normal text-muted-foreground">{t('vpt_pre_gst')}</span>
              </TableHead>

              {/* Col 6 */}
              <TableHead className="text-right whitespace-nowrap">
                {t('vpt_markup_pct')}
                <br />
                <span className="text-xs font-normal text-muted-foreground">{t('vpt_vs_reiky')}</span>
              </TableHead>

              {/* Col 7 */}
              <TableHead className="text-right whitespace-nowrap">
                {t('vpt_with_gst')}
                <br />
                <span className="text-xs font-normal text-muted-foreground">{t('vpt_customer_pays')}</span>
              </TableHead>

              {/* Col 8 */}
              <TableHead className="text-right whitespace-nowrap">
                {t('vpt_net_after_cc')}
                <br />
                <span className="text-xs font-normal text-muted-foreground">{t('vpt_after_cc')}</span>
              </TableHead>

              {/* Col 9 */}
              <TableHead className="text-right whitespace-nowrap text-emerald-700">
                {t('kyn_profit')}
                <br />
                <span className="text-xs font-normal text-muted-foreground">sell − cost</span>
              </TableHead>

              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {fields.map((field, index) => {
              const supplierMop = parseFloat(variants?.[index]?.cost_price_mop ?? '0') || 0
              const reikyMop    = parseFloat(variants?.[index]?.reiky_cost_mop  ?? '0') || 0
              const sellSgd     = parseFloat(variants?.[index]?.sell_price_sgd  ?? '0') || 0

              const supplierSgd   = supplierMop > 0 ? supplierMop * rate : null
              const gstTotalMop   = supplierMop > 0 ? supplierMop * (1 + GST) : null
              const gstTotalSgd   = gstTotalMop != null ? gstTotalMop * rate : null
              const reikySgd      = reikyMop > 0 ? reikyMop * rate : null
              const markupPct     = reikySgd && reikySgd > 0 && sellSgd > 0
                ? ((sellSgd - reikySgd) / reikySgd) * 100
                : null
              const withGstSgd    = sellSgd > 0 ? sellSgd * (1 + GST) : null
              const netAfterCcSgd = withGstSgd != null ? withGstSgd * (1 - CC_FEE) : null
              const kynProfit     = reikySgd != null && sellSgd > 0 ? sellSgd - reikySgd : null

              return (
                <TableRow key={field.id}>
                  {/* Col 1: Size */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Input
                        {...register(`variants.${index}.bead_size_mm`)}
                        placeholder="10"
                        className="w-14"
                        step="0.5"
                      />
                      <span className="text-muted-foreground text-xs select-none">–</span>
                      <Input
                        {...register(`variants.${index}.bead_size_mm_max`)}
                        placeholder="opt"
                        className="w-14 text-muted-foreground"
                        step="0.5"
                      />
                    </div>
                  </TableCell>

                  {/* Col 2: Supplier Cost MOP */}
                  <TableCell>
                    <div className="space-y-1">
                      <Input
                        {...register(`variants.${index}.cost_price_mop`)}
                        type="number" step="0.01" placeholder="0.00 MOP"
                        className="w-28"
                      />
                      {supplierSgd != null && (
                        <div className="text-xs text-muted-foreground pl-1">≈ S${supplierSgd.toFixed(2)}</div>
                      )}
                    </div>
                  </TableCell>

                  {/* Col 3: Supplier + 9% GST */}
                  <TableCell className="text-center text-sm">
                    {gstTotalMop != null ? (
                      <div>
                        <div className="font-medium">{gstTotalMop.toFixed(2)} MOP</div>
                        <div className="text-xs text-muted-foreground">S${gstTotalSgd!.toFixed(2)}</div>
                      </div>
                    ) : '—'}
                  </TableCell>

                  {/* Col 4: Reiky Cost MOP */}
                  <TableCell>
                    <div className="space-y-1">
                      <Input
                        {...register(`variants.${index}.reiky_cost_mop`)}
                        type="number" step="0.01" placeholder="0.00 MOP"
                        className="w-28"
                      />
                      {reikySgd != null && (
                        <div className="text-xs text-muted-foreground pl-1">≈ S${reikySgd.toFixed(2)}</div>
                      )}
                    </div>
                  </TableCell>

                  {/* Col 5: SG Sell Price */}
                  <TableCell className="text-right">
                    <Input
                      {...register(`variants.${index}.sell_price_sgd`)}
                      type="number" step="0.01" placeholder="0.00"
                      className="w-28 text-right ml-auto"
                    />
                  </TableCell>

                  {/* Col 6: Markup % */}
                  <TableCell className="text-right text-sm">
                    {markupPct != null ? (
                      <span className={`font-medium ${markupPct >= 0 ? 'text-blue-600' : 'text-destructive'}`}>
                        {markupPct.toFixed(1)}%
                      </span>
                    ) : '—'}
                  </TableCell>

                  {/* Col 7: + 9% GST (customer pays) */}
                  <TableCell className="text-right text-sm">
                    {withGstSgd != null ? (
                      <span className="font-medium">S${withGstSgd.toFixed(2)}</span>
                    ) : '—'}
                  </TableCell>

                  {/* Col 8: Net after CC */}
                  <TableCell className="text-right text-sm">
                    {netAfterCcSgd != null ? (
                      <span className="font-medium">S${netAfterCcSgd.toFixed(2)}</span>
                    ) : '—'}
                  </TableCell>

                  {/* Col 9: Kyn Profit */}
                  <TableCell className="text-right text-sm">
                    {kynProfit != null ? (
                      <span className={`font-medium ${kynProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                        S${kynProfit.toFixed(2)}
                      </span>
                    ) : '—'}
                  </TableCell>

                  <TableCell>
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                      <Trash2 size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ bead_size_mm: '', bead_size_mm_max: '', cost_price_mop: '', reiky_cost_mop: '', sell_price_sgd: '' })}
      >
        <Plus size={14} className="mr-1" />
        {t('vpt_add_size')}
      </Button>
    </div>
  )
}
