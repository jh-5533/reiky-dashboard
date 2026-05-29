import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ProductStatusBadge } from '@/components/products/ProductStatusBadge'
import { ProductFilters } from '@/components/products/ProductFilters'
import { calcPrice } from '@/lib/pricing'
import { Edit } from 'lucide-react'
import type { Database } from '@/types/database'

type Crystal = Database['public']['Tables']['crystals']['Row']

const FALLBACK_RATE = 0.175

interface SearchParams {
  q?: string
  status?: string
  category?: string
}

async function ProductList({ searchParams }: { searchParams: SearchParams }) {
  let crystals: Crystal[] = []

  try {
    const supabase = await createClient()
    let query = supabase.from('crystals').select('*').order('created_at', { ascending: false })

    if (searchParams.status && searchParams.status !== 'all') {
      query = query.eq('status', searchParams.status as 'draft' | 'published' | 'secret')
    }
    if (searchParams.category && searchParams.category !== 'all') {
      query = query.eq('category', searchParams.category)
    }
    if (searchParams.q) {
      query = query.ilike('name', `%${searchParams.q}%`)
    }

    const { data } = await query
    crystals = (data ?? []) as Crystal[]
  } catch {
    crystals = []
  }

  const config = { mopSgdRate: FALLBACK_RATE, ccFeePct: 3.4, gstPct: 9 }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Img</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Cost (MOP)</TableHead>
          <TableHead className="text-right">Markup %</TableHead>
          <TableHead className="text-right">Final SGD</TableHead>
          <TableHead className="w-20">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {crystals.map((crystal) => {
          const finalSgd =
            crystal.cost_price_mop != null
              ? calcPrice(crystal.cost_price_mop, crystal.markup_pct, config).finalSgd
              : null

          return (
            <TableRow key={crystal.id}>
              <TableCell>
                <div className="w-10 h-10 rounded-md bg-gradient-to-br from-stone-200 to-stone-400" aria-hidden />
              </TableCell>
              <TableCell className="font-medium">{crystal.name}</TableCell>
              <TableCell className="capitalize text-muted-foreground text-sm">
                {crystal.category ?? '—'}
              </TableCell>
              <TableCell>
                <ProductStatusBadge status={crystal.status} />
              </TableCell>
              <TableCell className="text-right text-sm">
                {crystal.cost_price_mop != null ? `MOP ${crystal.cost_price_mop}` : '—'}
              </TableCell>
              <TableCell className="text-right text-sm">{crystal.markup_pct}%</TableCell>
              <TableCell className="text-right text-sm font-medium">
                {finalSgd != null ? `S$${finalSgd.toFixed(2)}` : '—'}
              </TableCell>
              <TableCell>
                <Link
                  href={`/products/${crystal.id}`}
                  className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Edit size={12} />
                  Edit
                </Link>
              </TableCell>
            </TableRow>
          )
        })}
        {crystals.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
              No products found. Create your first product.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

export default async function ProductsPage({
  searchParams: rawSearchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const searchParams = await rawSearchParams

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your crystal inventory.</p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          New Product
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">All Products</CardTitle>
          <Suspense>
            <ProductFilters />
          </Suspense>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Loading products…</div>}>
            <ProductList searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
