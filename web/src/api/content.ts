import apiClient from './client'

export const contentApi = {
  generateVideo: (data: { productId: string; style?: string; duration?: number }) =>
    apiClient.post('/ai/video/generate', data),

  generateImages: (data: { productId: string; style?: string; count?: number }) =>
    apiClient.post('/ai/image/generate', data),

  generateCopy: (data: { productId: string; language: string; platform: string }) =>
    apiClient.post('/ai/chat/complete', data),

  getTaskStatus: (taskId: string) => apiClient.get(`/ai/tasks/${taskId}`),
}
