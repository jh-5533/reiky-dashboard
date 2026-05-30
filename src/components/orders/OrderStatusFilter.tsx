'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useLanguage } from '@/contexts/LanguageContext'

export function OrderStatusFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  function handleChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all' && value !== null) {
      params.set('status', value)
    } else {
      params.delete('status')
    }
    router.push(`/orders?${params.toString()}`)
  }

  return (
    <Select
      defaultValue={searchParams.get('status') ?? 'all'}
      onValueChange={handleChange}
    >
      <SelectTrigger className="w-44">
        <SelectValue placeholder={t('orders_filter_all')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t('orders_filter_all')}</SelectItem>
        <SelectItem value="pending">{t('orders_status_pending')}</SelectItem>
        <SelectItem value="confirmed">{t('orders_status_confirmed')}</SelectItem>
        <SelectItem value="processing">{t('orders_status_processing')}</SelectItem>
        <SelectItem value="shipped">{t('orders_status_shipped')}</SelectItem>
        <SelectItem value="delivered">{t('orders_status_delivered')}</SelectItem>
        <SelectItem value="cancelled">{t('orders_status_cancelled')}</SelectItem>
      </SelectContent>
    </Select>
  )
}
