import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ChevronLeft } from 'lucide-react'
import { CustomerProfileClient } from '@/components/customers/CustomerProfileClient'
import { getLang, t } from '@/lib/i18n/server'
import type { Database } from '@/types/database'

type Order = Database['public']['Tables']['orders']['Row']
type Customer = Database['public']['Tables']['customers']['Row']

export default async function CustomerDetailPage({
  params: rawParams,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }, lang] = await Promise.all([rawParams, getLang()])
  const supabase = await createClient()

  const customerRes = await supabase.from('customers').select('*').eq('id', id).single()
  if (!customerRes.data) notFound()
  const customer = customerRes.data as Customer

  const ordersRes = await supabase.from('orders').select('*').eq('customer_id', id).order('created_at', { ascending: false })
  const orders: Order[] = (ordersRes.data ?? []) as Order[]

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} />
          {t(lang, 'nav_customers')}
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{customer.full_name ?? customer.email ?? 'Customer'}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date(customer.created_at).toLocaleDateString('en-SG', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t(lang, 'customers_total_orders')}</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{orders.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t(lang, 'customers_total_spent')}</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">S${customer.total_spent.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t(lang, 'customers_col_tags')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {(customer.tags ?? []).map((tag: string) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
              {(customer.tags ?? []).length === 0 && (
                <span className="text-sm text-muted-foreground">{t(lang, 'customers_none')}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <CustomerProfileClient customer={customer} />

      <Card>
        <CardHeader><CardTitle>{t(lang, 'customers_order_history')}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t(lang, 'orders_col_number')}</TableHead>
                <TableHead>{t(lang, 'orders_col_date')}</TableHead>
                <TableHead className="text-right">{t(lang, 'orders_detail_total')}</TableHead>
                <TableHead>{t(lang, 'orders_col_status')}</TableHead>
                <TableHead className="w-20">{t(lang, 'customers_col_actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right font-medium">S${order.total_sgd.toFixed(2)}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{order.status}</Badge></TableCell>
                  <TableCell>
                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      {t(lang, 'orders_view')}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    {t(lang, 'orders_empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
