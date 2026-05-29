import { NextResponse } from 'next/server'

const FALLBACK_RATE = 0.175
const CACHE_DURATION_MS = 60 * 60 * 1000 // 1 hour

// In-memory cache
let cachedRate: number | null = null
let cacheTime: number | null = null

export async function GET() {
  // Return cached value if still fresh
  if (cachedRate !== null && cacheTime !== null) {
    if (Date.now() - cacheTime < CACHE_DURATION_MS) {
      return NextResponse.json({
        rate: cachedRate,
        source: 'cache' as const,
        fetched_at: new Date(cacheTime).toISOString(),
      })
    }
  }

  const apiKey = process.env.EXCHANGE_RATE_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      rate: FALLBACK_RATE,
      source: 'fallback' as const,
      fetched_at: new Date().toISOString(),
    })
  }

  try {
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/MOP/SGD`,
      { next: { revalidate: 3600 } }
    )

    if (!res.ok) {
      throw new Error(`Exchange rate API error: ${res.status}`)
    }

    const data = (await res.json()) as { conversion_rate?: number; result?: string }

    if (data.result !== 'success' || typeof data.conversion_rate !== 'number') {
      throw new Error('Invalid response from exchange rate API')
    }

    cachedRate = data.conversion_rate
    cacheTime = Date.now()

    return NextResponse.json({
      rate: cachedRate,
      source: 'api' as const,
      fetched_at: new Date(cacheTime).toISOString(),
    })
  } catch {
    // Use previous cache even if stale, or fallback
    if (cachedRate !== null && cacheTime !== null) {
      return NextResponse.json({
        rate: cachedRate,
        source: 'cache' as const,
        fetched_at: new Date(cacheTime).toISOString(),
      })
    }

    return NextResponse.json({
      rate: FALLBACK_RATE,
      source: 'fallback' as const,
      fetched_at: new Date().toISOString(),
    })
  }
}
