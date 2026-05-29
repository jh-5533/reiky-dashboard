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
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  })

  const variants = watch('variants') as Array<{ bead_size_mm: string; cost_price_mop: string }>

  const config = { mopSgdRate: rate, ccFeePct: 3.4, gstPct: 9 }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bead Size (mm)</TableHead>
            <TableHead>Cost Price (MOP)</TableHead>
            <TableHead className="text-right">SGD Cost</TableHead>
            <TableHead className="text-right">Final SGD</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, index) => {
            const costMop = parseFloat(variants?.[index]?.cost_price_mop ?? '0') || 0
            const pricing =
              costMop > 0
                ? calcPrice(costMop, markupPct, config)
                : null

            return (
              <TableRow key={field.id}>
                <TableCell>
                  <Input
                    {...register(`variants.${index}.bead_size_mm`)}
                    placeholder="e.g. 8"
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    {...register(`variants.${index}.cost_price_mop`)}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-32"
                  />
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {pricing ? `S$${pricing.costSgd.toFixed(2)}` : '—'}
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {pricing ? `S$${pricing.finalSgd.toFixed(2)}` : '—'}
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

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ bead_size_mm: '', cost_price_mop: '' })}
      >
        <Plus size={14} className="mr-1" />
        Add Size
      </Button>
    </div>
  )
}
