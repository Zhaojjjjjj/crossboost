import apiClient from './client'

export const accountApi = {
  list: () => apiClient.get('/accounts'),

  connect: (platform: string) =>
    apiClient.post('/accounts/connect', { platform }),

  disconnect: (id: string) => apiClient.delete(`/accounts/${id}`),
}
