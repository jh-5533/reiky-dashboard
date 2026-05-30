'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'

interface Props {
  url: string
}

export function CopySecretLinkButton({ url }: Props) {
  const [copied, setCopied] = useState(false)

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
          Copied!
        </>
      ) : (
        <>
          <Copy size={14} className="mr-1" />
          Copy Secret Link
        </>
      )}
    </Button>
  )
}
