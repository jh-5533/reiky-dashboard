/**
 * Pricing calculator: MOP cost → final SGD price
 *
 * Formula:
 *   sgd_base   = cost_mop × mop_sgd_rate
 *   sgd_retail = sgd_base × (1 + markup/100)
 *   with_cc    = sgd_retail / (1 - cc_fee/100)
 *   with_gst   = with_cc × (1 + gst/100)
 */

export interface PricingConfig {
  mopSgdRate: number      // live exchange rate
  ccFeePct: number        // credit card fee %  (default 3.4)
  gstPct: number          // GST %              (default 9)
}

export interface PricingResult {
  costSgd: number         // raw SGD cost (no markup)
  retailSgd: number       // after markup
  withCcSgd: number       // after CC fee pass-through
  finalSgd: number        // after GST  ← this is what customer pays
  effectiveMarginPct: number  // true margin as % of final price
}

export function calcPrice(
  costMop: number,
  markupPct: number,
  config: PricingConfig
): PricingResult {
  const costSgd = costMop * config.mopSgdRate
  const retailSgd = costSgd * (1 + markupPct / 100)
  const withCcSgd = retailSgd / (1 - config.ccFeePct / 100)
  const finalSgd = withCcSgd * (1 + config.gstPct / 100)
  const effectiveMarginPct = ((finalSgd - costSgd) / finalSgd) * 100
  return {
    costSgd: round2(costSgd),
    retailSgd: round2(retailSgd),
    withCcSgd: round2(withCcSgd),
    finalSgd: round2(finalSgd),
    effectiveMarginPct: round2(effectiveMarginPct),
  }
}

/** Build markup table from 30% to 100% in 5% steps */
export function buildMarkupTable(
  costMop: number,
  config: PricingConfig,
  steps: number[] = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
): Array<{ markupPct: number } & PricingResult> {
  return steps.map(m => ({ markupPct: m, ...calcPrice(costMop, m, config) }))
}

/** Bull / Bear blended profit scenarios */
export interface BullBearInput {
  items: Array<{ costMop: number; markupPct: number; quantity: number }>
  config: PricingConfig
}
export interface BullBearResult {
  totalRevenueSgd: number
  totalCostSgd: number
  grossProfitSgd: number
  grossMarginPct: number
}
export function calcBullBear(input: BullBearInput): { bull: BullBearResult; bear: BullBearResult; base: BullBearResult } {
  function scenario(markupMultiplier: number): BullBearResult {
    let rev = 0, cost = 0
    for (const item of input.items) {
      const p = calcPrice(item.costMop, item.markupPct * markupMultiplier, input.config)
      rev  += p.finalSgd * item.quantity
      cost += p.costSgd  * item.quantity
    }
    const profit = rev - cost
    return {
      totalRevenueSgd: round2(rev),
      totalCostSgd:    round2(cost),
      grossProfitSgd:  round2(profit),
      grossMarginPct:  rev > 0 ? round2((profit / rev) * 100) : 0,
    }
  }
  return {
    bull: scenario(1.2),  // 20% above set markups (optimistic)
    base: scenario(1.0),  // exactly set markups
    bear: scenario(0.8),  // 20% below set markups (conservative / discounts)
  }
}

function round2(n: number) { return Math.round(n * 100) / 100 }
