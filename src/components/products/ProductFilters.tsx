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

export function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

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
        placeholder="Search products…"
        className="w-64"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => setParam('q', e.target.value)}
      />
      <Select
        defaultValue={searchParams.get('status') ?? 'all'}
        onValueChange={(v) => setParam('status', v ?? 'all')}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="published">Published</SelectItem>
          <SelectItem value="secret">Secret</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
        </SelectContent>
      </Select>
      <Select
        defaultValue={searchParams.get('category') ?? 'all'}
        onValueChange={(v) => setParam('category', v ?? 'all')}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="wealth">Wealth</SelectItem>
          <SelectItem value="love">Love</SelectItem>
          <SelectItem value="protection">Protection</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
