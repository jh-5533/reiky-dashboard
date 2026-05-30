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
import { ImageUploader, type UploadedImage } from './ImageUploader'
import { ProductPreview } from './ProductPreview'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Plus } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
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
  sell_price_sgd: z.string(),
})

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  stone_type: z.string(),
  category: z.string(),
  badge: z.string(),
  description: z.string(),
  status: z.enum(['draft', 'published', 'secret']),
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
  { bead_size_mm: '6',  cost_price_mop: '', reiky_cost_mop: '', sell_price_sgd: '' },
  { bead_size_mm: '8',  cost_price_mop: '', reiky_cost_mop: '', sell_price_sgd: '' },
  { bead_size_mm: '10', cost_price_mop: '', reiky_cost_mop: '', sell_price_sgd: '' },
  { bead_size_mm: '12', cost_price_mop: '', reiky_cost_mop: '', sell_price_sgd: '' },
]

export function ProductForm({ crystal, variants = [], initialImages = [] }: Props) {
  const router = useRouter()
  const [images, setImages] = useState<UploadedImage[]>(initialImages)
  const [rate, setRate] = useState(0.175)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLanguage()

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
              sell_price_sgd: v.sell_price_sgd?.toString() ?? '',
            }))
          : DEFAULT_VARIANTS,
    },
  })

  const { fields: highlightFields, append: addHighlight, remove: removeHighlight } =
    useFieldArray({ control: form.control, name: 'highlights' })

  const watchedName = form.watch('name')

  useEffect(() => {
    if (!crystal) {
      form.setValue('slug', slugify(watchedName))
    }
  }, [watchedName, crystal, form])

  useEffect(() => {
    fetch('/api/exchange-rate')
      .then((r) => r.json())
      .then((d: { rate: number }) => setRate(d.rate))
      .catch(() => {})
  }, [])

  const handleSave = useCallback(
    async (values: FormValues) => {
      setSaving(true)
      setError(null)

      try {
        const supabase = createClient()

        const firstCost = values.variants.find((v) => v.cost_price_mop)
        const cost_price_mop = firstCost
          ? parseFloat(firstCost.cost_price_mop)
          : null

        const firstSellVariant = values.variants.find((v) => v.sell_price_sgd && v.reiky_cost_mop)
        const display_price_sgd = firstSellVariant
          ? parseFloat(firstSellVariant.sell_price_sgd) * 1.09
          : null

        const firstMarkupVariant = values.variants.find((v) => v.sell_price_sgd && v.reiky_cost_mop)
        const markup_pct = firstMarkupVariant && rate > 0
          ? Math.round(
              (parseFloat(firstMarkupVariant.sell_price_sgd) - parseFloat(firstMarkupVariant.reiky_cost_mop) * rate)
              / (parseFloat(firstMarkupVariant.reiky_cost_mop) * rate) * 100
            )
          : 0

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
          markup_pct,
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
            sell_price_sgd: v.sell_price_sgd ? parseFloat(v.sell_price_sgd) : null,
            sort_order: i,
            in_stock: true,
          }))

        if (variantsToInsert.length > 0) {
          await supabase.from('crystal_variants').insert(variantsToInsert)
        }

        for (let i = 0; i < images.length; i++) {
          const img = images[i]
          if (!img.file) continue
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

  const propertyFields: Array<[keyof FormValues['properties'], Parameters<typeof t>[0]]> = [
    ['chakra',     'form_chakra'],
    ['element',    'form_element'],
    ['origin',     'form_origin'],
    ['hardness',   'form_hardness'],
    ['colour',     'form_colour'],
    ['zodiac',     'form_zodiac'],
    ['intention',  'form_intention'],
    ['bead_size',  'form_bead_size'],
  ]

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
            <TabsTrigger value="edit">{t('common_edit')}</TabsTrigger>
            <TabsTrigger value="preview">{t('form_tab_preview')}</TabsTrigger>
          </TabsList>

          <TabsContent value="preview">
            <ProductPreview rate={rate} markupPct={0} />
          </TabsContent>

          <TabsContent value="edit" className="space-y-6">

        {/* A. Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form_basic_info')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('form_name')} *</Label>
                <Input {...form.register('name')} placeholder="Rose Quartz Bracelet" />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t('form_slug')} *</Label>
                <Input {...form.register('slug')} placeholder="rose-quartz-bracelet" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('form_stone_type')}</Label>
                <Input {...form.register('stone_type')} placeholder="Rose Quartz" />
              </div>
              <div className="space-y-2">
                <Label>{t('form_category')}</Label>
                <Select
                  defaultValue={crystal?.category ?? ''}
                  onValueChange={(v) => form.setValue('category', String(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('form_select_category')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wealth">{t('filters_wealth')}</SelectItem>
                    <SelectItem value="love">{t('filters_love')}</SelectItem>
                    <SelectItem value="protection">{t('filters_protection')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('form_badge')}</Label>
                <Select
                  defaultValue={crystal?.badge ?? ''}
                  onValueChange={(v) => form.setValue('badge', String(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('badge_none')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('badge_none')}</SelectItem>
                    <SelectItem value="Bestseller">{t('badge_bestseller')}</SelectItem>
                    <SelectItem value="Popular">{t('badge_popular')}</SelectItem>
                    <SelectItem value="New">{t('badge_new')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('form_status')}</Label>
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
                    <SelectItem value="draft">{t('status_draft')}</SelectItem>
                    <SelectItem value="published">{t('status_published')}</SelectItem>
                    <SelectItem value="secret">{t('status_secret')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('form_star_rating')}</Label>
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
                <Label>{t('form_review_count')}</Label>
                <Input
                  {...form.register('review_count', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* B. Images */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form_images')}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('form_images_hint')}</p>
          </CardHeader>
          <CardContent>
            <ImageUploader images={images} onChange={setImages} maxImages={6} />
          </CardContent>
        </Card>

        {/* C. Highlights */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form_highlights')}</CardTitle>
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
              {t('form_add_highlight')}
            </Button>
          </CardContent>
        </Card>

        {/* D. Description */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form_description')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              {...form.register('description')}
              rows={4}
              placeholder="Describe this crystal…"
            />
          </CardContent>
        </Card>

        {/* E. Crystal Properties */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form_crystal_props')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {propertyFields.map(([key, labelKey]) => (
                <div key={key} className="space-y-2">
                  <Label>{t(labelKey)}</Label>
                  <Input
                    {...form.register(`properties.${key}`)}
                    placeholder={t(labelKey)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* E. Pricing by MM size */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form_pricing')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Rate: 1 MOP = {rate} SGD
            </p>
            <VariantPricingTable rate={rate} />
          </CardContent>
        </Card>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/products')}
            >
              {t('form_cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t('form_saving') : crystal ? t('form_save') : t('form_create')}
            </Button>
          </div>

          </TabsContent>
        </Tabs>
      </form>
    </FormProvider>
  )
}
