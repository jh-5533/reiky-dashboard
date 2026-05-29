'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm, FormProvider, useFieldArray } from 'react-hook-form'
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
import { VariantPricingTable } from './VariantPricingTable'
import { MarkupTableDisplay } from './MarkupTableDisplay'
import { ImageUploader, type UploadedImage } from './ImageUploader'
import { ProductPreview } from './ProductPreview'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { calcPrice } from '@/lib/pricing'
import { Trash2, Plus } from 'lucide-react'
import type { Database } from '@/types/database'

type Crystal = Database['public']['Tables']['crystals']['Row']
type Variant = Database['public']['Tables']['crystal_variants']['Row']

const highlightSchema = z.object({
  icon: z.string(),
  title: z.string(),
  description: z.string(),
})

const variantSchema = z.object({
  bead_size_mm: z.string(),
  cost_price_mop: z.string(),
  reiky_cost_mop: z.string(),
})

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  stone_type: z.string(),
  category: z.string(),
  badge: z.string(),
  description: z.string(),
  status: z.enum(['draft', 'published', 'secret']),
  markup_pct: z.number().min(0),
  review_count: z.number().min(0),
  rating: z.number().min(0).max(5),
  properties: z.object({
    chakra: z.string(),
    element: z.string(),
    origin: z.string(),
    hardness: z.string(),
    colour: z.string(),
    zodiac: z.string(),
    intention: z.string(),
    bead_size: z.string(),
  }),
  highlights: z.array(highlightSchema),
  variants: z.array(variantSchema),
})

type FormValues = z.infer<typeof schema>

interface Props {
  crystal?: Crystal
  variants?: Variant[]
  initialImages?: UploadedImage[]
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const DEFAULT_VARIANTS = [
  { bead_size_mm: '6',  cost_price_mop: '', reiky_cost_mop: '' },
  { bead_size_mm: '8',  cost_price_mop: '', reiky_cost_mop: '' },
  { bead_size_mm: '10', cost_price_mop: '', reiky_cost_mop: '' },
  { bead_size_mm: '12', cost_price_mop: '', reiky_cost_mop: '' },
]

export function ProductForm({ crystal, variants = [], initialImages = [] }: Props) {
  const router = useRouter()
  const [images, setImages] = useState<UploadedImage[]>(initialImages)
  const [rate, setRate] = useState(0.175)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: crystal?.name ?? '',
      slug: crystal?.slug ?? '',
      stone_type: crystal?.stone_type ?? '',
      category: crystal?.category ?? '',
      badge: crystal?.badge ?? '',
      description: crystal?.description ?? '',
      status: crystal?.status ?? 'draft',
      markup_pct: crystal?.markup_pct ?? 60,
      review_count: crystal?.review_count ?? 0,
      rating: crystal?.rating ?? 5.0,
      properties: {
        chakra: '',
        element: '',
        origin: '',
        hardness: '',
        colour: '',
        zodiac: '',
        intention: '',
        bead_size: '',
        ...(typeof crystal?.properties === 'object' && crystal.properties !== null
          ? (crystal.properties as Record<string, string>)
          : {}),
      },
      highlights: Array.isArray(crystal?.highlights)
        ? (crystal.highlights as Array<{ icon: string; title: string; description: string }>)
        : [
            { icon: '', title: '', description: '' },
            { icon: '', title: '', description: '' },
            { icon: '', title: '', description: '' },
          ],
      variants:
        variants.length > 0
          ? variants.map((v) => ({
              bead_size_mm: v.bead_size_mm.toString(),
              cost_price_mop: v.cost_price_mop.toString(),
              reiky_cost_mop: v.reiky_cost_mop?.toString() ?? '',
            }))
          : DEFAULT_VARIANTS,
    },
  })

  const { fields: highlightFields, append: addHighlight, remove: removeHighlight } =
    useFieldArray({ control: form.control, name: 'highlights' })

  const watchedMarkup = form.watch('markup_pct')
  const watchedName = form.watch('name')
  const watchedVariants = form.watch('variants')

  // Auto-generate slug from name (only when not editing)
  useEffect(() => {
    if (!crystal) {
      form.setValue('slug', slugify(watchedName))
    }
  }, [watchedName, crystal, form])

  // Fetch exchange rate
  useEffect(() => {
    fetch('/api/exchange-rate')
      .then((r) => r.json())
      .then((d: { rate: number }) => setRate(d.rate))
      .catch(() => {})
  }, [])

  // Find the first variant with a cost for the markup table display
  const firstVariantCost = parseFloat(
    watchedVariants?.find((v) => v.cost_price_mop)?.cost_price_mop ?? '0'
  ) || 0

  const handleSave = useCallback(
    async (values: FormValues) => {
      setSaving(true)
      setError(null)

      try {
        const supabase = createClient()

        // Calculate cost_price_mop from first variant with a cost
        const firstCost = values.variants.find((v) => v.cost_price_mop)
        const cost_price_mop = firstCost
          ? parseFloat(firstCost.cost_price_mop)
          : null

        // Compute display_price_sgd from first variant that has a Reiky cost
        const firstReikyVariant = values.variants.find((v) => v.reiky_cost_mop && v.cost_price_mop)
        const display_price_sgd = firstReikyVariant
          ? calcPrice(
              parseFloat(firstReikyVariant.reiky_cost_mop),
              values.markup_pct,
              { mopSgdRate: rate, ccFeePct: 3.4, gstPct: 9 }
            ).finalSgd
          : null

        const crystalData = {
          name: values.name,
          slug: values.slug,
          stone_type: values.stone_type || null,
          category: values.category || null,
          badge: values.badge || null,
          description: values.description || null,
          highlights: values.highlights,
          properties: values.properties,
          cost_price_mop,
          markup_pct: values.markup_pct,
          status: values.status,
          secret_token: crystal?.secret_token ?? null,
          review_count: values.review_count,
          rating: values.rating,
          display_price_sgd,
        }

        let crystalId = crystal?.id

        if (crystal) {
          await supabase
            .from('crystals')
            .update(crystalData)
            .eq('id', crystal.id)
        } else {
          const { data, error: insertError } = await supabase
            .from('crystals')
            .insert(crystalData)
            .select('id')
            .single()

          if (insertError) throw insertError
          crystalId = data.id
        }

        if (!crystalId) throw new Error('No crystal ID')

        // Upsert variants
        if (crystal) {
          await supabase
            .from('crystal_variants')
            .delete()
            .eq('crystal_id', crystalId)
        }

        const variantsToInsert = values.variants
          .filter((v) => v.bead_size_mm && v.cost_price_mop)
          .map((v, i) => ({
            crystal_id: crystalId!,
            bead_size_mm: parseFloat(v.bead_size_mm),
            cost_price_mop: parseFloat(v.cost_price_mop),
            reiky_cost_mop: v.reiky_cost_mop ? parseFloat(v.reiky_cost_mop) : null,
            sort_order: i,
            in_stock: true,
          }))

        if (variantsToInsert.length > 0) {
          await supabase.from('crystal_variants').insert(variantsToInsert)
        }

        // TODO: replace with actual bucket when configured
        // Image upload to Supabase Storage 'product-images' bucket
        for (let i = 0; i < images.length; i++) {
          const img = images[i]
          if (!img.file) continue // already uploaded
          // TODO: upload img.file to Supabase storage
          // const { data: uploadData } = await supabase.storage
          //   .from('product-images')
          //   .upload(`${crystalId}/${img.id}`, img.file)
          // then insert crystal_images record
        }

        router.push('/products')
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save product')
      } finally {
        setSaving(false)
      }
    },
    [crystal, images, router]
  )

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSave)}>
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <Tabs defaultValue="edit">
          <TabsList className="mb-4">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="preview">
            <ProductPreview rate={rate} markupPct={Number(watchedMarkup)} />
          </TabsContent>

          <TabsContent value="edit" className="space-y-6">

        {/* A. Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input {...form.register('name')} placeholder="Rose Quartz Bracelet" />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input {...form.register('slug')} placeholder="rose-quartz-bracelet" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stone Type</Label>
                <Input {...form.register('stone_type')} placeholder="Rose Quartz" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  defaultValue={crystal?.category ?? ''}
                  onValueChange={(v) => form.setValue('category', String(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wealth">Wealth</SelectItem>
                    <SelectItem value="love">Love</SelectItem>
                    <SelectItem value="protection">Protection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Badge</Label>
                <Select
                  defaultValue={crystal?.badge ?? ''}
                  onValueChange={(v) => form.setValue('badge', String(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="Bestseller">Bestseller</SelectItem>
                    <SelectItem value="Popular">Popular</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  defaultValue={crystal?.status ?? 'draft'}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Star Rating (1–5)</Label>
                <Input
                  {...form.register('rating', { valueAsNumber: true })}
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  placeholder="5.0"
                />
              </div>
              <div className="space-y-2">
                <Label>Review Count</Label>
                <Input
                  {...form.register('review_count', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                {...form.register('description')}
                rows={4}
                placeholder="Describe this crystal…"
              />
            </div>
          </CardContent>
        </Card>

        {/* B. Images */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload up to 6 images. First image is the hero.
            </p>
          </CardHeader>
          <CardContent>
            <ImageUploader images={images} onChange={setImages} maxImages={6} />
          </CardContent>
        </Card>

        {/* C. Crystal Properties */}
        <Card>
          <CardHeader>
            <CardTitle>Crystal Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  ['chakra', 'Chakra'],
                  ['element', 'Element'],
                  ['origin', 'Origin'],
                  ['hardness', 'Hardness'],
                  ['colour', 'Colour'],
                  ['zodiac', 'Zodiac'],
                  ['intention', 'Intention'],
                  ['bead_size', 'Bead Size'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Input
                    {...form.register(`properties.${key}`)}
                    placeholder={label}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* D. Highlights */}
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

        {/* E. Pricing by MM size */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing by Bead Size</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label>Markup % (applies to all sizes)</Label>
                <Input
                  {...form.register('markup_pct')}
                  type="number"
                  step="1"
                  className="w-28"
                />
              </div>
              <div className="text-sm text-muted-foreground pt-6">
                Rate: 1 MOP = {rate} SGD
              </div>
            </div>

            <VariantPricingTable rate={rate} markupPct={Number(watchedMarkup)} />

            {firstVariantCost > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Markup Reference Table</p>
                <MarkupTableDisplay
                  costMop={firstVariantCost}
                  config={{ mopSgdRate: rate, ccFeePct: 3.4, gstPct: 9 }}
                  currentMarkup={Number(watchedMarkup)}
                />
              </div>
            )}
          </CardContent>
        </Card>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/products')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : crystal ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>

          </TabsContent>
        </Tabs>
      </form>
    </FormProvider>
  )
}
