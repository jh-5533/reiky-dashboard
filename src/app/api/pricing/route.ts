import { NextRequest, NextResponse } from 'next/server'
import { calcPrice, buildMarkupTable } from '@/lib/pricing'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const costMop = parseFloat(searchParams.get('cost_mop') ?? '0')
  const markupPct = parseFloat(searchParams.get('markup_pct') ?? '60')
  const mopSgdRate = parseFloat(searchParams.get('rate') ?? '0.175')
  const ccFeePct = parseFloat(searchParams.get('cc_fee') ?? '3.4')
  const gstPct = parseFloat(searchParams.get('gst') ?? '9')

  const config = { mopSgdRate, ccFeePct, gstPct }

  const result = calcPrice(costMop, markupPct, config)
  const table = buildMarkupTable(costMop, config)

  return NextResponse.json({ result, table })
}
