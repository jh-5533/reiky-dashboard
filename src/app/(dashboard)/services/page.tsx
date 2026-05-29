import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
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
import { Edit } from 'lucide-react'
import type { Database } from '@/types/database'

type Service = Database['public']['Tables']['services']['Row']

function ServiceStatusBadge({ status }: { status: Service['status'] }) {
  if (status === 'published')
    return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Published</Badge>
  if (status === 'secret')
    return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Secret</Badge>
  return <Badge variant="secondary">Draft</Badge>
}

function formatPrice(service: Service): string {
  if (service.price_sgd != null) return `S$${service.price_sgd.toFixed(2)}`
  if (Array.isArray(service.tiers) && service.tiers.length > 0) {
    return `${service.tiers.length} tiers`
  }
  return '—'
}

export default async function ServicesPage() {
  let services: Service[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false })
    services = data ?? []
  } catch {
    services = []
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage incense, bazi, fengshui, and custom services.
          </p>
        </div>
        <Link href="/services/new">
          <Button>New Service</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Services</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price / Tiers</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="capitalize text-muted-foreground text-sm">
                    {service.category ?? '—'}
                  </TableCell>
                  <TableCell>
                    <ServiceStatusBadge status={service.status} />
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatPrice(service)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/services/${service.id}`}>
                      <Button size="sm" variant="outline">
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {services.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No services yet. Create your first service.
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
