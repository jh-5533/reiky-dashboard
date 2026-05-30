'use client'

import { useFieldArray, useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { calcPrice } from '@/lib/pricing'
import { Trash2, Plus } from 'lucide-react'

interface Props {
  rate: number
  markupPct: number
}

export function VariantPricingTable({ rate, markupPct }: Props) {
  const { control, register, watch } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name: 'variants' })

  const variants = watch('variants') as Array<{
    bead_size_mm: string
    cost_price_mop: string
    reiky_cost_mop: string
  }>

  const config = { mopSgdRate: rate, ccFeePct: 3.4, gstPct: 9 }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24 whitespace-nowrap">Size (mm)</TableHead>
              <TableHead className="whitespace-nowrap">
                Supplier Cost
                <br />
                <span className="text-xs font-normal text-muted-foreground">MOP — declare at customs</span>
              </TableHead>
              <TableHead className="text-center whitespace-nowrap">
                + 9% Import GST
                <br />
                <span className="text-xs font-normal text-muted-foreground">MOP / SGD</span>
              </TableHead>
              <TableHead className="whitespace-nowrap">
                Reiky Cost
                <br />
                <span className="text-xs font-normal text-muted-foreground">Macau shop price — MOP / SGD</span>
              </TableHead>
              <TableHead className="text-center whitespace-nowrap">
                Final Price
                <br />
                <span className="text-xs font-normal text-muted-foreground">SGD / margin</span>
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const supplierMop = parseFloat(variants?.[index]?.cost_price_mop ?? '0') || 0
              const reikyMop   = parseFloat(variants?.[index]?.reiky_cost_mop  ?? '0') || 0

              const gstMop  = supplierMop > 0 ? supplierMop * 1.09 : null
              const gstSgd  = gstMop != null  ? gstMop * rate : null
              const reikySgd = reikyMop > 0   ? reikyMop * rate : null
              const pricing  = reikyMop > 0   ? calcPrice(reikyMop, markupPct, config) : null

              return (
                <TableRow key={field.id}>
                  {/* Col 1 — Bead size */}
                  <TableCell>
                    <Input
                      {...register(`variants.${index}.bead_size_mm`)}
                      placeholder="e.g. 8"
                      className="w-20"
                    />
                  </TableCell>

                  {/* Col 2 — Supplier cost (MOP) */}
                  <TableCell>
                    <Input
                      {...register(`variants.${index}.cost_price_mop`)}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-28"
                    />
                  </TableCell>

                  {/* Col 3 — +9% GST (calculated) */}
                  <TableCell className="text-center text-sm">
                    {gstMop != null ? (
                      <div>
                        <div className="font-medium">{gstMop.toFixed(2)} MOP</div>
                        <div className="text-xs text-muted-foreground">S${gstSgd!.toFixed(2)}</div>
                      </div>
                    ) : '—'}
                  </TableCell>

                  {/* Col 4 — Reiky cost (editable) */}
                  <TableCell>
                    <div className="space-y-1">
                      <Input
                        {...register(`variants.${index}.reiky_cost_mop`)}
                        type="number"
                        step="0.01"
                        placeholder="0.00 MOP"
                        className="w-28"
                      />
                      {reikySgd != null && (
                        <div className="text-xs text-muted-foreground pl-1">
                          ≈ S${reikySgd.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Col 5 — Final SGD + margin (calculated from Reiky cost) */}
                  <TableCell className="text-center">
                    {pricing ? (
                      <div>
                        <div className="font-medium text-sm">S${pricing.finalSgd.toFixed(2)}</div>
                        <div className="text-xs text-pink-600 font-medium">
                          {pricing.effectiveMarginPct.toFixed(1)}% margin
                        </div>
                      </div>
                    ) : '—'}
                  </TableCell>

                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
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
        onClick={() => append({ bead_size_mm: '', cost_price_mop: '', reiky_cost_mop: '' })}
      >
        <Plus size={14} className="mr-1" />
        Add Size
      </Button>
    </div>
  )
}
