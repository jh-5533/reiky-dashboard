'use client'

import { useState, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Plus } from 'lucide-react'
import type { Database } from '@/types/database'

type Service = Database['public']['Tables']['services']['Row']

const highlightSchema = z.object({
  icon: z.string(),
  title: z.string(),
  description: z.string(),
})

const tierSchema = z.object({
  name: z.string(),
  price_sgd: z.string(),
  description: z.string(),
})

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  category: z.string(),
  description: z.string(),
  status: z.enum(['draft', 'published', 'secret']),
  pricing_type: z.enum(['single', 'tiered']),
  price_sgd: z.string(),
  tiers: z.array(tierSchema),
  highlights: z.array(highlightSchema),
  image_url: z.string(),
})

type FormValues = z.infer<typeof schema>

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

interface Props {
  service?: Service
}

export function ServiceForm({ service }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasTiers =
    Array.isArray(service?.tiers) && (service?.tiers as unknown[]).length > 0

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: service?.name ?? '',
      slug: service?.slug ?? '',
      category: service?.category ?? '',
      description: service?.description ?? '',
      status: service?.status ?? 'draft',
      pricing_type: hasTiers ? 'tiered' : 'single',
      price_sgd: service?.price_sgd?.toString() ?? '',
      tiers: hasTiers
        ? (service!.tiers as Array<{ name: string; price_sgd: number; description: string }>).map(
            (t) => ({
              name: t.name,
              price_sgd: t.price_sgd.toString(),
              description: t.description,
            })
          )
        : [{ name: '', price_sgd: '', description: '' }],
      highlights: Array.isArray(service?.highlights)
        ? (service.highlights as Array<{ icon: string; title: string; description: string }>)
        : [
            { icon: '', title: '', description: '' },
            { icon: '', title: '', description: '' },
            { icon: '', title: '', description: '' },
          ],
      image_url: service?.image_url ?? '',
    },
  })

  const pricingType = form.watch('pricing_type')
  const watchedName = form.watch('name')

  const { fields: highlightFields, append: addHighlight, remove: removeHighlight } =
    useFieldArray({ control: form.control, name: 'highlights' })

  const { fields: tierFields, append: addTier, remove: removeTier } =
    useFieldArray({ control: form.control, name: 'tiers' })

  // Auto-slug
  useState(() => {
    if (!service) form.setValue('slug', slugify(watchedName))
  })

  const handleSave = useCallback(
    async (values: FormValues) => {
      setSaving(true)
      setError(null)

      try {
        const supabase = createClient()

        const serviceData = {
          name: values.name,
          slug: values.slug,
          category: values.category || null,
          description: values.description || null,
          highlights: values.highlights,
          tiers:
            values.pricing_type === 'tiered'
              ? values.tiers.map((t) => ({
                  ...t,
                  price_sgd: parseFloat(t.price_sgd) || 0,
                }))
              : [],
          price_sgd:
            values.pricing_type === 'single' && values.price_sgd
              ? parseFloat(values.price_sgd)
              : null,
          status: values.status,
          secret_token: service?.secret_token ?? null,
          image_url: values.image_url || null,
        }

        if (service) {
          await supabase.from('services').update(serviceData).eq('id', service.id)
        } else {
          const { error: insertError } = await supabase
            .from('services')
            .insert(serviceData)
          if (insertError) throw insertError
        }

        router.push('/services')
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save service')
      } finally {
        setSaving(false)
      }
    },
    [service, router]
  )

  return (
    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                {...form.register('name')}
                placeholder="Cleansing Incense Set"
                onChange={(e) => {
                  form.setValue('name', e.target.value)
                  if (!service) form.setValue('slug', slugify(e.target.value))
                }}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input {...form.register('slug')} placeholder="cleansing-incense-set" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                defaultValue={service?.category ?? ''}
                onValueChange={(v) => form.setValue('category', String(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incense">Incense</SelectItem>
                  <SelectItem value="bazi">Bazi</SelectItem>
                  <SelectItem value="fengshui">Fengshui</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                defaultValue={service?.status ?? 'draft'}
                onValueChange={(v) =>
                  form.setValue('status', (v ?? 'draft') as 'draft' | 'published' | 'secret')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="secret">Secret</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              {...form.register('description')}
              rows={4}
              placeholder="Describe this service…"
            />
          </div>

          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input
              {...form.register('image_url')}
              placeholder="https://…"
              type="url"
            />
          </div>
        </CardContent>
      </Card>

      {/* Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Highlights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {highlightFields.map((field, index) => (
            <div key={field.id} className="flex gap-3 items-start">
              <Input
                {...form.register(`highlights.${index}.icon`)}
                placeholder="✨"
                className="w-16 text-center"
              />
              <Input
                {...form.register(`highlights.${index}.title`)}
                placeholder="Title"
                className="w-40"
              />
              <Input
                {...form.register(`highlights.${index}.description`)}
                placeholder="Description"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeHighlight(index)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addHighlight({ icon: '', title: '', description: '' })}
          >
            <Plus size={14} className="mr-1" />
            Add Highlight
          </Button>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              type="button"
              variant={pricingType === 'single' ? 'default' : 'outline'}
              size="sm"
              onClick={() => form.setValue('pricing_type', 'single')}
            >
              Single Price
            </Button>
            <Button
              type="button"
              variant={pricingType === 'tiered' ? 'default' : 'outline'}
              size="sm"
              onClick={() => form.setValue('pricing_type', 'tiered')}
            >
              Tiered Pricing
            </Button>
          </div>

          {pricingType === 'single' && (
            <div className="space-y-2">
              <Label>Price (SGD)</Label>
              <Input
                {...form.register('price_sgd')}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-40"
              />
            </div>
          )}

          {pricingType === 'tiered' && (
            <div className="space-y-3">
              <div className="rounded border">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Tier Name</th>
                      <th className="text-left px-4 py-2 font-medium">Price SGD</th>
                      <th className="text-left px-4 py-2 font-medium">Description</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {tierFields.map((field, index) => (
                      <tr key={field.id} className="border-b last:border-0">
                        <td className="px-4 py-2">
                          <Input
                            {...form.register(`tiers.${index}.name`)}
                            placeholder="Small"
                            className="h-8"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            {...form.register(`tiers.${index}.price_sgd`)}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="h-8 w-28"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            {...form.register(`tiers.${index}.description`)}
                            placeholder="Description"
                            className="h-8"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => removeTier(index)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTier({ name: '', price_sgd: '', description: '' })}
              >
                <Plus size={14} className="mr-1" />
                Add Tier
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/services')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : service ? 'Save Changes' : 'Create Service'}
        </Button>
      </div>
    </form>
  )
}
