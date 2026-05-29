import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft } from 'lucide-react'
import { ProductForm } from '@/components/products/ProductForm'
import { DeleteProductButton } from '@/components/products/DeleteProductButton'
import { CopySecretLinkButton } from '@/components/products/CopySecretLinkButton'
import type { UploadedImage } from '@/components/products/ImageUploader'
import type { Database } from '@/types/database'

type Crystal = Database['public']['Tables']['crystals']['Row']
type Variant = Database['public']['Tables']['crystal_variants']['Row']
type CrystalImage = Database['public']['Tables']['crystal_images']['Row']

export default async function EditProductPage({
  params: rawParams,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await rawParams
  const supabase = await createClient()

  const crystalRes = await supabase.from('crystals').select('*').eq('id', id).single()
  const variantsRes = await supabase.from('crystal_variants').select('*').eq('crystal_id', id).order('sort_order')
  const imagesRes = await supabase.from('crystal_images').select('*').eq('crystal_id', id).order('sort_order')

  if (!crystalRes.data) notFound()

  const crystal = crystalRes.data as Crystal
  const variants = (variantsRes.data ?? []) as Variant[]
  const dbImages = (imagesRes.data ?? []) as CrystalImage[]

  const initialImages: UploadedImage[] = dbImages.map((img) => ({
    id: img.id,
    preview: img.url,
    storagePath: img.storage_path,
    url: img.url,
  }))

  const secretLinkUrl = crystal.secret_token
    ? `https://reiky-website.vercel.app/crystals/product.html?secret=${crystal.secret_token}`
    : null

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={16} />
            Products
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{crystal.name}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Edit product details.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {secretLinkUrl && <CopySecretLinkButton url={secretLinkUrl} />}
          <DeleteProductButton id={crystal.id} name={crystal.name} />
        </div>
      </div>

      <ProductForm crystal={crystal} variants={variants} initialImages={initialImages} />
    </div>
  )
}
