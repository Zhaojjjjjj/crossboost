import apiClient from './client'

export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiClient.post('/users/login', data),

  register: (data: { name: string; email: string; password: string }) =>
    apiClient.post('/users/register', data),

  getProfile: () => apiClient.get('/users/profile'),
}
