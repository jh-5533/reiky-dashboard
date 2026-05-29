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
import { calcBullBear } from '@/lib/pricing'
import { RevenueChart } from '@/components/overview/RevenueChart'
import type { Database } from '@/types/database'

type Crystal = Database['public']['Tables']['crystals']['Row']

async function getStats() {
  try {
    const supabase = await createClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const [ordersToday, revenueMonth, activeProducts, activeCustomers] =
      await Promise.all([
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', today.toISOString()),
        supabase
          .from('orders')
          .select('total_sgd')
          .gte('created_at', startOfMonth.toISOString()),
        supabase
          .from('crystals')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published'),
        supabase
          .from('customers')
          .select('id', { count: 'exact', head: true }),
      ])

    const monthRevenue = (revenueMonth.data ?? []).reduce(
      (sum, o) => sum + (o.total_sgd ?? 0),
      0
    )

    return {
      ordersToday: ordersToday.count ?? 0,
      revenueMonth: monthRevenue,
      activeProducts: activeProducts.count ?? 0,
      activeCustomers: activeCustomers.count ?? 0,
    }
  } catch {
    return {
      ordersToday: 0,
      revenueMonth: 0,
      activeProducts: 0,
      activeCustomers: 0,
    }
  }
}

async function getCrystalsForAnalysis(): Promise<Crystal[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('crystals')
      .select('*')
      .eq('status', 'published')
    return data ?? []
  } catch {
    return []
  }
}

export default async function OverviewPage() {
  const [stats, crystals] = await Promise.all([
    getStats(),
    getCrystalsForAnalysis(),
  ])

  const bullBearItems = crystals
    .filter((c) => c.cost_price_mop != null)
    .map((c) => ({
      costMop: c.cost_price_mop!,
      markupPct: c.markup_pct,
      quantity: 1,
    }))

  const analysis =
    bullBearItems.length > 0
      ? calcBullBear({
          items: bullBearItems,
          config: { mopSgdRate: 0.175, ccFeePct: 3.4, gstPct: 9 },
        })
      : null

  const statCards = [
    {
      title: 'Orders Today',
      value: stats.ordersToday.toString(),
      description: 'New orders since midnight',
    },
    {
      title: 'Revenue This Month',
      value: `S$${stats.revenueMonth.toFixed(2)}`,
      description: 'Total SGD collected',
    },
    {
      title: 'Active Products',
      value: stats.activeProducts.toString(),
      description: 'Published crystals',
    },
    {
      title: 'Active Customers',
      value: stats.activeCustomers.toString(),
      description: 'Total customers in CRM',
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back. Here&apos;s what&apos;s happening with Reiky SG.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue (SGD)</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart />
        </CardContent>
      </Card>

      {/* Bull / Bear Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Bull / Bear Profit Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">
            Based on {bullBearItems.length} published products. Bear = 80% of
            set markups, Base = 100%, Bull = 120%.
          </p>
        </CardHeader>
        <CardContent>
          {analysis ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Bear (–20%)</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right text-emerald-600">
                    Bull (+20%)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Revenue</TableCell>
                  <TableCell className="text-right">
                    S${analysis.bear.totalRevenueSgd.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    S${analysis.base.totalRevenueSgd.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600">
                    S${analysis.bull.totalRevenueSgd.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Cost</TableCell>
                  <TableCell className="text-right">
                    S${analysis.bear.totalCostSgd.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    S${analysis.base.totalCostSgd.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600">
                    S${analysis.bull.totalCostSgd.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Gross Profit</TableCell>
                  <TableCell className="text-right">
                    S${analysis.bear.grossProfitSgd.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    S${analysis.base.grossProfitSgd.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600">
                    S${analysis.bull.grossProfitSgd.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Margin %</TableCell>
                  <TableCell className="text-right">
                    {analysis.bear.grossMarginPct.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {analysis.base.grossMarginPct.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right text-emerald-600">
                    {analysis.bull.grossMarginPct.toFixed(1)}%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No published products with cost data found. Add products to see
              analysis.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
