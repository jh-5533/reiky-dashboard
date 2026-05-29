'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { buildMarkupTable } from '@/lib/pricing'
import type { PricingConfig } from '@/lib/pricing'

interface Props {
  costMop: number
  config: PricingConfig
  currentMarkup: number
}

export function MarkupTableDisplay({ costMop, config, currentMarkup }: Props) {
  const rows = buildMarkupTable(costMop, config)

  return (
    <div className="max-h-64 overflow-y-auto rounded border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Markup</TableHead>
            <TableHead className="text-right">Retail SGD</TableHead>
            <TableHead className="text-right">Final SGD</TableHead>
            <TableHead className="text-right">Margin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const selected = Math.round(currentMarkup) === row.markupPct
            return (
              <TableRow
                key={row.markupPct}
                className={selected ? 'bg-[#C4956A]/10 font-semibold' : ''}
              >
                <TableCell>{row.markupPct}%</TableCell>
                <TableCell className="text-right">
                  S${row.retailSgd.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  S${row.finalSgd.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {row.effectiveMarginPct.toFixed(1)}%
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
