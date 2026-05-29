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
import { CustomerSearch } from '@/components/customers/CustomerSearch'
import type { Database } from '@/types/database'

type Customer = Database['public']['Tables']['customers']['Row']

interface SearchParams {
  q?: string
}

async function CustomerList({ searchParams }: { searchParams: SearchParams }) {
  let customers: Customer[] = []

  try {
    const supabase = await createClient()
    let query = supabase.from('customers').select('*').order('created_at', { ascending: false })

    if (searchParams.q) {
      query = query.or(`full_name.ilike.%${searchParams.q}%,email.ilike.%${searchParams.q}%`)
    }

    const { data } = await query
    customers = (data ?? []) as Customer[]
  } catch {
    customers = []
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead className="text-right">Orders</TableHead>
          <TableHead className="text-right">Total Spent</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="w-20">Actions</TableHead>
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
            <TableCell className="text-right font-medium">
              S${customer.total_spent.toFixed(2)}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(customer.created_at).toLocaleDateString('en-SG', {
                month: 'short',
                year: 'numeric',
              })}
            </TableCell>
            <TableCell>
              <Link
                href={`/customers/${customer.id}`}
                className="inline-flex items-center rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
              >
                View
              </Link>
            </TableCell>
          </TableRow>
        ))}
        {customers.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
              No customers found.
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
  const searchParams = await rawSearchParams

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">CRM — manage customer relationships.</p>
        </div>
        <button className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors">
          New Customer
        </button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">All Customers</CardTitle>
          <Suspense>
            <CustomerSearch />
          </Suspense>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Loading customers…</div>}>
            <CustomerList searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
