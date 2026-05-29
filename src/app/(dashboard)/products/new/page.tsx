import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ProductForm } from '@/components/products/ProductForm'

export default function NewProductPage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} />
          Products
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Product</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Create a new crystal product listing.
          </p>
        </div>
      </div>

      <ProductForm />
    </div>
  )
}
