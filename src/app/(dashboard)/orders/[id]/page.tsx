import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ChevronLeft } from 'lucide-react'
import { OrderDetailClient } from '@/components/orders/OrderDetailClient'
import { getLang, t } from '@/lib/i18n/server'
import type { Database } from '@/types/database'

type Order = Database['public']['Tables']['orders']['Row']
type OrderItem = Database['public']['Tables']['order_items']['Row']
type Customer = Database['public']['Tables']['customers']['Row']

export default async function OrderDetailPage({
  params: rawParams,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }, lang] = await Promise.all([rawParams, getLang()])
  const supabase = await createClient()

  const orderRes = await supabase.from('orders').select('*').eq('id', id).single()
  if (!orderRes.data) notFound()
  const order = orderRes.data as Order

  const itemsRes = await supabase.from('order_items').select('*').eq('order_id', id).order('created_at')
  const items: OrderItem[] = (itemsRes.data ?? []) as OrderItem[]

  let customerName: string | null = null
  if (order.customer_id) {
    const customerRes = await supabase.from('customers').select('full_name, email').eq('id', order.customer_id).single()
    const customer = customerRes.data as Pick<Customer, 'full_name' | 'email'> | null
    customerName = customer?.full_name ?? customer?.email ?? null
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} />
          {t(lang, 'nav_orders')}
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {lang === 'zh' ? `订单 ${order.order_number}` : `Order ${order.order_number}`}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date(order.created_at).toLocaleDateString('en-SG', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t(lang, 'orders_detail_customer')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-medium">{customerName ?? order.customer_email ?? t(lang, 'orders_detail_guest')}</p>
            {order.customer_email && <p className="text-sm text-muted-foreground">{order.customer_email}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t(lang, 'orders_detail_order_info')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-mono text-sm">{order.order_number}</p>
            <p className="text-sm text-muted-foreground capitalize">
              {lang === 'zh' ? '付款方式：' : 'Payment: '}{order.payment_method ?? '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t(lang, 'orders_detail_total')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">S${order.total_sgd.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t(lang, 'orders_detail_items')}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t(lang, 'orders_detail_item')}</TableHead>
                <TableHead className="text-right">{t(lang, 'orders_detail_unit')}</TableHead>
                <TableHead className="text-right">{t(lang, 'orders_detail_qty')}</TableHead>
                <TableHead className="text-right">{t(lang, 'orders_detail_discount')}</TableHead>
                <TableHead className="text-right">{t(lang, 'orders_detail_line_total')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.bead_size_mm && <p className="text-xs text-muted-foreground">{item.bead_size_mm}mm</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">S${item.unit_price_sgd.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{item.discount_pct > 0 ? `${item.discount_pct}%` : '—'}</TableCell>
                  <TableCell className="text-right font-medium">S${item.line_total_sgd.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                    {t(lang, 'orders_detail_no_items')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t(lang, 'orders_detail_subtotal')}</span>
              <span>S${order.subtotal_sgd.toFixed(2)}</span>
            </div>
            {order.discount_sgd > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t(lang, 'orders_detail_discount')}</span>
                <span className="text-destructive">−S${order.discount_sgd.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t(lang, 'orders_detail_gst')}</span>
              <span>S${order.gst_sgd.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>{t(lang, 'orders_detail_total')}</span>
              <span>S${order.total_sgd.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <OrderDetailClient order={order} />
    </div>
  )
}
