'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props {
  url: string
}

export function CopySecretLinkButton({ url }: Props) {
  const [copied, setCopied] = useState(false)
  const { t } = useLanguage()

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? (
        <>
          <Check size={14} className="mr-1 text-pink-600" />
          {t('copy_link_copied')}
        </>
      ) : (
        <>
          <Copy size={14} className="mr-1" />
          {t('copy_link_btn')}
        </>
      )}
    </Button>
  )
}
