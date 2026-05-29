'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'

export function CustomerSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('q', value)
    } else {
      params.delete('q')
    }
    router.push(`/customers?${params.toString()}`)
  }

  return (
    <Input
      placeholder="Search by name or email…"
      className="w-72"
      defaultValue={searchParams.get('q') ?? ''}
      onChange={(e) => handleSearch(e.target.value)}
    />
  )
}
