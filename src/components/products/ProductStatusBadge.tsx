'use client'

import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props {
  status: 'draft' | 'published' | 'secret'
}

export function ProductStatusBadge({ status }: Props) {
  const { t } = useLanguage()
  if (status === 'published') {
    return <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-100">{t('status_published')}</Badge>
  }
  if (status === 'secret') {
    return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">{t('status_secret')}</Badge>
  }
  return <Badge variant="secondary">{t('status_draft')}</Badge>
}
