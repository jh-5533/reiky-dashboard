export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string; full_name: string | null; role: 'admin' | 'staff'; created_at: string }
        Insert: { id: string; email: string; full_name?: string | null; role?: 'admin' | 'staff' }
        Update: { full_name?: string | null; role?: 'admin' | 'staff' }
        Relationships: []
      }
      crystals: {
        Row: {
          id: string; slug: string; name: string; stone_type: string | null
          category: string | null; description: string | null
          highlights: Json; properties: Json
          cost_price_mop: number | null; markup_pct: number
          status: 'draft' | 'published' | 'secret'; secret_token: string | null
          badge: string | null
          review_count: number; rating: number
          display_price_sgd: number | null
          created_at: string; updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['crystals']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['crystals']['Insert']>
        Relationships: []
      }
      crystal_variants: {
        Row: { id: string; crystal_id: string; bead_size_mm: number; cost_price_mop: number; reiky_cost_mop: number | null; sell_price_sgd: number | null; sort_order: number; in_stock: boolean; created_at: string }
        Insert: Omit<Database['public']['Tables']['crystal_variants']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['crystal_variants']['Insert']>
        Relationships: []
      }
      crystal_images: {
        Row: { id: string; crystal_id: string; storage_path: string; url: string; sort_order: number; created_at: string }
        Insert: Omit<Database['public']['Tables']['crystal_images']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['crystal_images']['Insert']>
        Relationships: []
      }
      services: {
        Row: {
          id: string; slug: string; name: string; category: string | null
          description: string | null; highlights: Json; tiers: Json
          price_sgd: number | null; status: 'draft' | 'published' | 'secret'
          secret_token: string | null; image_url: string | null
          website_url: string | null
          created_at: string; updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['services']['Insert']>
        Relationships: []
      }
      customers: {
        Row: { id: string; email: string | null; full_name: string | null; phone: string | null; notes: string | null; tags: string[]; total_spent: number; order_count: number; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
        Relationships: []
      }
      orders: {
        Row: { id: string; order_number: string; customer_id: string | null; customer_email: string | null; status: string; payment_status: string; payment_method: string | null; subtotal_sgd: number; discount_sgd: number; gst_sgd: number; total_sgd: number; notes: string | null; secret_link_id: string | null; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'order_number' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
        Relationships: []
      }
      order_items: {
        Row: { id: string; order_id: string; product_type: string; crystal_id: string | null; variant_id: string | null; service_id: string | null; name: string; bead_size_mm: number | null; unit_price_sgd: number; quantity: number; discount_pct: number; line_total_sgd: number; created_at: string }
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
        Relationships: []
      }
      secret_links: {
        Row: { id: string; token: string; product_type: string; crystal_id: string | null; service_id: string | null; label: string | null; custom_price: number | null; expires_at: string | null; max_uses: number | null; use_count: number; is_active: boolean; created_at: string }
        Insert: Omit<Database['public']['Tables']['secret_links']['Row'], 'id' | 'token' | 'use_count' | 'created_at'>
        Update: Partial<Database['public']['Tables']['secret_links']['Insert']>
        Relationships: []
      }
      exchange_rates: {
        Row: { id: string; from_cur: string; to_cur: string; rate: number; source: string | null; fetched_at: string }
        Insert: Omit<Database['public']['Tables']['exchange_rates']['Row'], 'id' | 'fetched_at'>
        Update: never
        Relationships: []
      }
      settings: {
        Row: { key: string; value: Json; updated_at: string }
        Insert: { key: string; value: Json }
        Update: { value: Json }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
