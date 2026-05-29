'use client'

import { useFormContext } from 'react-hook-form'
import { calcPrice } from '@/lib/pricing'

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  wealth:     { label: 'Wealth & Abundance',    emoji: '✨' },
  love:       { label: 'Love & Relationships',  emoji: '🌸' },
  protection: { label: 'Protection & Grounding', emoji: '🛡️' },
}

const PROP_LABELS: Record<string, string> = {
  chakra: 'Chakra', element: 'Element', origin: 'Origin',
  hardness: 'Hardness', colour: 'Colour', zodiac: 'Zodiac',
  intention: 'Intention', bead_size: 'Bead Size',
}

interface Props {
  rate: number
  markupPct: number
}

export function ProductPreview({ rate, markupPct }: Props) {
  const form = useFormContext()
  const values = form.watch()

  const cat = CATEGORY_LABELS[values.category] ?? { label: values.category || '—', emoji: '' }

  // Compute display price from first variant with reiky_cost_mop
  const firstVariant = (values.variants ?? []).find(
    (v: { reiky_cost_mop: string }) => v.reiky_cost_mop && parseFloat(v.reiky_cost_mop) > 0
  )
  const displayPrice = firstVariant
    ? 'S$' + calcPrice(
        parseFloat(firstVariant.reiky_cost_mop),
        markupPct,
        { mopSgdRate: rate, ccFeePct: 3.4, gstPct: 9 }
      ).finalSgd.toFixed(2)
    : null

  const rating    = Number(values.rating)  || 5.0
  const reviews   = Number(values.review_count) || 0
  const badge     = values.badge || null
  const name      = values.name  || 'Product Name'
  const stone     = values.stone_type || 'Stone type'
  const desc      = values.description || ''
  const highlights: Array<{ icon: string; title: string; description: string }> =
    Array.isArray(values.highlights) ? values.highlights : []
  const props: Record<string, string> = values.properties ?? {}

  const propEntries = Object.entries(PROP_LABELS)
    .filter(([k]) => props[k])
    .map(([k, label]) => ({ label, value: props[k] }))

  return (
    <div className="space-y-8 p-6 bg-[#f5f5f5] min-h-full">

      {/* ── Mini Card (carousel) ── */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Carousel Card Preview
        </p>
        <div className="w-52 rounded-xl overflow-hidden bg-white border border-[#e8e8e8] shadow-sm">
          {/* Image area */}
          <div className="relative h-52 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-gray-300 text-4xl">🖼</span>
            {badge && (
              <span className="absolute top-3 left-3 text-[11px] font-semibold bg-white text-gray-800 px-2 py-0.5 rounded-full shadow-sm">
                {badge}
              </span>
            )}
          </div>
          {/* Body */}
          <div className="p-3 space-y-0.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
              <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">
                ★ {rating.toFixed(1)} · {reviews}
              </span>
            </div>
            <p className="text-xs text-gray-400 truncate">{stone}</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {displayPrice ?? <span className="text-gray-300">Enter price →</span>}
            </p>
          </div>
        </div>
      </section>

      {/* ── Detail Page ── */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Product Detail Page Preview
        </p>
        <div className="max-w-xl bg-white rounded-xl border border-[#e8e8e8] shadow-sm overflow-hidden">

          {/* Gallery placeholder */}
          <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-300 text-3xl">
            🖼 Gallery (6 photos)
          </div>

          <div className="p-5 space-y-5">
            {/* Title block */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{stone}</p>
              <p className="text-sm text-gray-500">{cat.emoji} {cat.label}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-amber-400 text-sm">★</span>
                <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
                <span className="text-gray-300 text-sm">·</span>
                <span className="text-sm text-[#1677ff] underline">{reviews} reviews</span>
              </div>
            </div>

            {/* Highlights */}
            {highlights.filter(h => h.title).length > 0 && (
              <div className="space-y-3 border-t border-[#f0f0f0] pt-4">
                {highlights.filter(h => h.title).map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-lg shrink-0 mt-0.5">{h.icon || '•'}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{h.title}</p>
                      <p className="text-sm text-gray-500">{h.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Description snippet */}
            {desc && (
              <div className="border-t border-[#f0f0f0] pt-4">
                <p className="text-sm text-gray-600 line-clamp-4">{desc}</p>
                {desc.length > 200 && (
                  <span className="text-xs text-[#1677ff]">Show more</span>
                )}
              </div>
            )}

            {/* Properties grid */}
            {propEntries.length > 0 && (
              <div className="border-t border-[#f0f0f0] pt-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">Crystal Properties</p>
                <div className="grid grid-cols-2 gap-2">
                  {propEntries.map(({ label, value }) => (
                    <div key={label} className="bg-[#fafafa] rounded-lg px-3 py-2 border border-[#f0f0f0]">
                      <p className="text-[11px] text-gray-400">{label}</p>
                      <p className="text-sm font-medium text-gray-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buy widget */}
            <div className="border-t border-[#f0f0f0] pt-4 rounded-lg border border-[#e8e8e8] p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {displayPrice ?? '—'}
                </span>
                <span className="text-sm text-gray-400">per bracelet</span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-10 rounded-lg bg-[#07c160] flex items-center justify-center text-white text-sm font-medium">
                  Buy Now on WhatsApp
                </div>
                <div className="h-10 rounded-lg border border-[#e8e8e8] flex items-center justify-center text-sm text-gray-700">
                  Add to Cart
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  )
}
