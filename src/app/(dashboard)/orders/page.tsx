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
import { Badge } from '@/components/ui/badge'
import { OrderStatusFilter } from '@/components/orders/OrderStatusFilter'
import type { Database } from '@/types/database'

type Order = Database['public']['Tables']['orders']['Row']

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-cyan-100 text-cyan-800',
    delivered: 'bg-pink-100 text-pink-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  const cls = map[status] ?? 'bg-gray-100 text-gray-800'
  return <Badge className={`${cls} hover:opacity-80 capitalize`}>{status}</Badge>
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: 'bg-pink-100 text-pink-800',
    unpaid: 'bg-red-100 text-red-800',
    partial: 'bg-yellow-100 text-yellow-800',
    refunded: 'bg-gray-100 text-gray-800',
  }
  const cls = map[status] ?? 'bg-gray-100 text-gray-800'
  return <Badge className={`${cls} hover:opacity-80 capitalize`}>{status}</Badge>
}

interface SearchParams {
  status?: string
}

async function OrderList({ searchParams }: { searchParams: SearchParams }) {
  let orders: Order[] = []

  try {
    const supabase = await createClient()
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false })

    if (searchParams.status && searchParams.status !== 'all') {
      query = query.eq('status', searchParams.status)
    }

    const { data } = await query
    orders = (data ?? []) as Order[]
  } catch {
    orders = []
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order #</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead className="text-right">Total SGD</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead className="w-20">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString('en-SG', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </TableCell>
            <TableCell className="text-sm">{order.customer_email ?? '—'}</TableCell>
            <TableCell className="text-right font-medium">
              S${order.total_sgd.toFixed(2)}
            </TableCell>
            <TableCell><OrderStatusBadge status={order.status} /></TableCell>
            <TableCell><PaymentBadge status={order.payment_status} /></TableCell>
            <TableCell>
              <Link
                href={`/orders/${order.id}`}
                className="inline-flex items-center rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
              >
                View
              </Link>
            </TableCell>
          </TableRow>
        ))}
        {orders.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
              No orders found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

export default async function OrdersPage({
  searchParams: rawSearchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const searchParams = await rawSearchParams

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage customer orders.</p>
        </div>
        <button className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors">
          New Order
        </button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">All Orders</CardTitle>
          <Suspense>
            <OrderStatusFilter />
          </Suspense>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Loading orders…</div>}>
            <OrderList searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
