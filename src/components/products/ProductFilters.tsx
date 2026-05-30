'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

export function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/products?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex gap-3 items-center flex-wrap">
      <Input
        placeholder={t('filters_search')}
        className="w-64"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => setParam('q', e.target.value)}
      />
      <Select
        defaultValue={searchParams.get('status') ?? 'all'}
        onValueChange={(v) => setParam('status', v ?? 'all')}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder={t('filters_all_statuses')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filters_all_statuses')}</SelectItem>
          <SelectItem value="published">{t('filters_published')}</SelectItem>
          <SelectItem value="secret">{t('filters_secret')}</SelectItem>
          <SelectItem value="draft">{t('filters_draft')}</SelectItem>
        </SelectContent>
      </Select>
      <Select
        defaultValue={searchParams.get('category') ?? 'all'}
        onValueChange={(v) => setParam('category', v ?? 'all')}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder={t('filters_all_categories')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('filters_all_categories')}</SelectItem>
          <SelectItem value="wealth">{t('filters_wealth')}</SelectItem>
          <SelectItem value="love">{t('filters_love')}</SelectItem>
          <SelectItem value="protection">{t('filters_protection')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
