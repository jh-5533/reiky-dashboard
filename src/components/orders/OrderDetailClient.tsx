'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Database } from '@/types/database'

type Order = Database['public']['Tables']['orders']['Row']

interface Props {
  order: Order
}

export function OrderDetailClient({ order }: Props) {
  const [status, setStatus] = useState(order.status)
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status)
  const [notes, setNotes] = useState(order.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { t } = useLanguage()

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase
        .from('orders')
        .update({ status, payment_status: paymentStatus, notes: notes || null })
        .eq('id', order.id)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('orders_detail_status_notes')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('orders_detail_order_status')}</Label>
            <Select value={status} onValueChange={(v) => setStatus(v ?? status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t('orders_status_pending')}</SelectItem>
                <SelectItem value="confirmed">{t('orders_status_confirmed')}</SelectItem>
                <SelectItem value="processing">{t('orders_status_processing')}</SelectItem>
                <SelectItem value="shipped">{t('orders_status_shipped')}</SelectItem>
                <SelectItem value="delivered">{t('orders_status_delivered')}</SelectItem>
                <SelectItem value="cancelled">{t('orders_status_cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('orders_detail_payment_status')}</Label>
            <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v ?? paymentStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">{t('orders_pay_unpaid')}</SelectItem>
                <SelectItem value="paid">{t('orders_pay_paid')}</SelectItem>
                <SelectItem value="partial">{t('orders_pay_partial')}</SelectItem>
                <SelectItem value="refunded">{t('orders_pay_refunded')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('orders_detail_notes')}</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t('orders_detail_notes_ph')}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('form_saving') : saved ? t('orders_detail_saved') : t('orders_detail_save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
