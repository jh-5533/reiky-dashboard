import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ProductForm } from '@/components/products/ProductForm'
import { getLang, t } from '@/lib/i18n/server'

export default async function NewProductPage() {
  const lang = await getLang()

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} />
          {t(lang, 'common_back_products')}
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t(lang, 'products_new_title')}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {t(lang, 'products_new_subtitle')}
          </p>
        </div>
      </div>

      <ProductForm />
    </div>
  )
}
