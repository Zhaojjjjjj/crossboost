'use client'

import { useState } from 'react'

interface Product {
  id: string
  name: string
  sku: string
  status: 'active' | 'draft'
  platforms: string[]
  contentCount: number
  createdAt: string
}

const mockProducts: Product[] = [
  { id: '1', name: 'Wireless Bluetooth Earbuds Pro', sku: 'WBE-001', status: 'active', platforms: ['TikTok Shop', 'Instagram'], contentCount: 12, createdAt: '2026-04-28' },
  { id: '2', name: 'Smart Watch Fitness Tracker', sku: 'SWF-002', status: 'active', platforms: ['TikTok Shop'], contentCount: 8, createdAt: '2026-04-25' },
  { id: '3', name: 'Portable Phone Charger 10000mAh', sku: 'PPC-003', status: 'draft', platforms: [], contentCount: 0, createdAt: '2026-04-20' },
]

export default function ProductsPage() {
  const [products] = useState(mockProducts)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog for content generation</p>
        </div>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
          + Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platforms</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">Created {product.createdAt}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-mono">{product.sku}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1 flex-wrap">
                    {product.platforms.map((p) => (
                      <span key={p} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">{p}</span>
                    ))}
                    {product.platforms.length === 0 && <span className="text-sm text-gray-400">—</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{product.contentCount} items</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="text-sm text-primary-600 hover:text-primary-800">Generate</button>
                    <button className="text-sm text-gray-600 hover:text-gray-800">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
