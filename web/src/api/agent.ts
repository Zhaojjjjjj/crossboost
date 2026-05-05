import apiClient from './client'

export const agentApi = {
  createTask: (data: { message: string; productId?: string }) =>
    apiClient.post('/agent/tasks', data),

  getTask: (taskId: string) => apiClient.get(`/agent/tasks/${taskId}`),

  listTasks: () => apiClient.get('/agent/tasks'),
}
