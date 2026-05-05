import apiClient from './client'

export const analyticsApi = {
  getOverview: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/analytics/overview', { params }),

  getByContent: (contentId: string) =>
    apiClient.get(`/analytics/content/${contentId}`),

  getTopContent: (params?: { platform?: string; limit?: number }) =>
    apiClient.get('/analytics/top-content', { params }),
}
