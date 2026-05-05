import apiClient from './client'

export const publishApi = {
  create: (data: { contentId: string; platforms: string[]; scheduledAt?: string }) =>
    apiClient.post('/publishing', data),

  list: (params?: { page?: number; pageSize?: number; status?: string }) =>
    apiClient.get('/publishing', { params }),

  getById: (id: string) => apiClient.get(`/publishing/${id}`),

  cancel: (id: string) => apiClient.post(`/publishing/${id}/cancel`),
}
