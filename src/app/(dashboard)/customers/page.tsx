import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CustomerSearch } from '@/components/customers/CustomerSearch'
import { getLang, t } from '@/lib/i18n/server'
import type { Database } from '@/types/database'

type Customer = Database['public']['Tables']['customers']['Row']

interface SearchParams { q?: string }

async function CustomerList({ searchParams, lang }: { searchParams: SearchParams; lang: 'en' | 'zh' }) {
  let customers: Customer[] = []
  try {
    const supabase = await createClient()
    let query = supabase.from('customers').select('*').order('created_at', { ascending: false })
    if (searchParams.q) {
      query = query.or(`full_name.ilike.%${searchParams.q}%,email.ilike.%${searchParams.q}%`)
    }
    const { data } = await query
    customers = (data ?? []) as Customer[]
  } catch { customers = [] }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t(lang, 'customers_col_name')}</TableHead>
          <TableHead>{t(lang, 'customers_col_email')}</TableHead>
          <TableHead>{t(lang, 'customers_col_phone')}</TableHead>
          <TableHead>{t(lang, 'customers_col_tags')}</TableHead>
          <TableHead className="text-right">{t(lang, 'customers_col_orders')}</TableHead>
          <TableHead className="text-right">{t(lang, 'customers_col_spent')}</TableHead>
          <TableHead>{t(lang, 'customers_col_joined')}</TableHead>
          <TableHead className="w-20">{t(lang, 'customers_col_actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell className="font-medium">{customer.full_name ?? '—'}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{customer.email ?? '—'}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{customer.phone ?? '—'}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {(customer.tags ?? []).map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </TableCell>
            <TableCell className="text-right">{customer.order_count}</TableCell>
            <TableCell className="text-right font-medium">S${customer.total_spent.toFixed(2)}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(customer.created_at).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' })}
            </TableCell>
            <TableCell>
              <Link
                href={`/customers/${customer.id}`}
                className="inline-flex items-center rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
              >
                {t(lang, 'customers_view')}
              </Link>
            </TableCell>
          </TableRow>
        ))}
        {customers.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
              {t(lang, 'customers_empty')}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

export default async function CustomersPage({
  searchParams: rawSearchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [searchParams, lang] = await Promise.all([rawSearchParams, getLang()])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t(lang, 'customers_title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t(lang, 'customers_subtitle')}</p>
        </div>
        <button className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors">
          {t(lang, 'customers_new')}
        </button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{t(lang, 'customers_all')}</CardTitle>
          <Suspense><CustomerSearch /></Suspense>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense fallback={<div className="py-12 text-center text-muted-foreground">{t(lang, 'customers_loading')}</div>}>
            <CustomerList searchParams={searchParams} lang={lang} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
