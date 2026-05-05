import { create } from 'zustand'

interface Product {
  id: string
  name: string
  sku: string
  description?: string
  sellingPoints?: string[]
  images?: string[]
  status: 'active' | 'draft'
  createdAt: string
}

interface ProductState {
  products: Product[]
  selectedProduct: Product | null
  setProducts: (products: Product[]) => void
  setSelectedProduct: (product: Product | null) => void
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  selectedProduct: null,
  setProducts: (products) => set({ products }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
}))
