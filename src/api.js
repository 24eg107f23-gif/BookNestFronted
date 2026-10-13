import axios from 'axios'

const apiHost = window.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost'
const defaultApiBaseUrl = import.meta.env.PROD
  ? 'https://booknestbckend.onrender.com/api'
  : `http://${apiHost}:8080/api`

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('booknest-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('booknest-token')) {
      localStorage.removeItem('booknest-token')
      localStorage.removeItem('booknest-user')
      window.dispatchEvent(new Event('booknest:session-expired'))
    }
    return Promise.reject(error)
  },
)

export function messageFromError(error) {
  if (!error.response) {
    return 'Cannot reach the BookNest API. Start the backend in a second terminal with: cd BookNest\\backend; mvn spring-boot:run'
  }
  return error.response?.data?.message || error.message || 'Something went wrong. Please try again.'
}

export default api
