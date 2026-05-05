import apiClient from './client'

export const productApi = {
  list: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get('/products', { params }),

  getById: (id: string) => apiClient.get(`/products/${id}`),

  create: (data: { name: string; sku: string; description?: string; sellingPoints?: string[] }) =>
    apiClient.post('/products', data),

  update: (id: string, data: Record<string, any>) =>
    apiClient.patch(`/products/${id}`, data),

  delete: (id: string) => apiClient.delete(`/products/${id}`),
}
