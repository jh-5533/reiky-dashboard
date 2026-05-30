'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { Copy, Check, Link2, Plus } from 'lucide-react'

interface ProductOption {
  id: string
  name: string
}

const schema = z.object({
  product_type: z.enum(['crystal', 'service']),
  crystal_id: z.string().optional(),
  service_id: z.string().optional(),
  label: z.string(),
  custom_price: z.string(),
  expires_at: z.string(),
  max_uses: z.string(),
})

type FormValues = z.infer<typeof schema>

interface CopyButtonProps {
  url: string
}

function CopyButton({ url }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button size="sm" variant="outline" onClick={handleCopy}>
      {copied ? (
        <><Check size={12} className="mr-1 text-pink-600" />Copied</>
      ) : (
        <><Copy size={12} className="mr-1" />Copy</>
      )}
    </Button>
  )
}

interface Props {
  mode: 'button' | 'copy'
  url?: string
}

export function SecretLinksClient({ mode, url }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [crystals, setCrystals] = useState<ProductOption[]>([])
  const [services, setServices] = useState<ProductOption[]>([])
  const [generating, setGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      product_type: 'crystal',
      label: '',
      custom_price: '',
      expires_at: '',
      max_uses: '',
    },
  })

  const productType = form.watch('product_type')

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    Promise.all([
      supabase.from('crystals').select('id, name').eq('status', 'published'),
      supabase.from('services').select('id, name').eq('status', 'published'),
    ]).then(([c, s]) => {
      setCrystals((c.data ?? []) as ProductOption[])
      setServices((s.data ?? []) as ProductOption[])
    })
  }, [open])

  async function handleGenerate(values: FormValues) {
    setGenerating(true)
    try {
      const supabase = createClient()
      const linkData = {
        product_type: values.product_type,
        crystal_id: values.product_type === 'crystal' ? (values.crystal_id ?? null) : null,
        service_id: values.product_type === 'service' ? (values.service_id ?? null) : null,
        label: values.label || null,
        custom_price: values.custom_price ? parseFloat(values.custom_price) : null,
        expires_at: values.expires_at || null,
        max_uses: values.max_uses ? parseInt(values.max_uses) : null,
        is_active: true,
      }
      const { data, error } = await supabase.from('secret_links').insert(linkData).select('token').single()
      if (error) throw error
      const fullUrl = `https://reiky-website.vercel.app/crystals/product.html?secret=${(data as { token: string }).token}`
      setGeneratedUrl(fullUrl)
      router.refresh()
    } catch {
      // ignore
    } finally {
      setGenerating(false)
    }
  }

  async function copyGenerated() {
    if (!generatedUrl) return
    await navigator.clipboard.writeText(generatedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (mode === 'copy' && url) return <CopyButton url={url} />

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) { setGeneratedUrl(null); form.reset() }
      }}
    >
      <DialogTrigger className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors">
        <Plus size={14} />
        Generate Link
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Secret Link</DialogTitle>
        </DialogHeader>

        {generatedUrl ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Your secret link has been created:</p>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <Link2 size={14} className="text-muted-foreground shrink-0" />
              <span className="text-xs font-mono truncate flex-1">{generatedUrl}</span>
            </div>
            <Button className="w-full" onClick={copyGenerated}>
              {copied ? (
                <><Check size={14} className="mr-2 text-pink-600" />Copied!</>
              ) : (
                <><Copy size={14} className="mr-2" />Copy to Clipboard</>
              )}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => { setGeneratedUrl(null); form.reset() }}>
              Generate Another
            </Button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-4">
            <div className="space-y-2">
              <Label>Product Type</Label>
              <Select
                defaultValue="crystal"
                onValueChange={(v) => form.setValue('product_type', String(v) as 'crystal' | 'service')}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="crystal">Crystal</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {productType === 'crystal' && (
              <div className="space-y-2">
                <Label>Crystal</Label>
                <Select onValueChange={(v) => form.setValue('crystal_id', String(v) || undefined)}>
                  <SelectTrigger><SelectValue placeholder="Select crystal…" /></SelectTrigger>
                  <SelectContent>
                    {crystals.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {productType === 'service' && (
              <div className="space-y-2">
                <Label>Service</Label>
                <Select onValueChange={(v) => form.setValue('service_id', String(v) || undefined)}>
                  <SelectTrigger><SelectValue placeholder="Select service…" /></SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Label (internal note)</Label>
              <Input {...form.register('label')} placeholder="e.g. VIP customer discount" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Custom Price (SGD)</Label>
                <Input {...form.register('custom_price')} type="number" step="0.01" placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label>Max Uses</Label>
                <Input {...form.register('max_uses')} type="number" placeholder="Unlimited" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input {...form.register('expires_at')} type="date" />
            </div>

            <Button type="submit" className="w-full" disabled={generating}>
              {generating ? 'Generating…' : 'Create Link'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
