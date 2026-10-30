import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Before every request: attach the JWT if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// After every response: if the token is rejected, log the user out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const onLoginPage = window.location.pathname.startsWith('/login');
    if (error.response?.status === 401 && !onLoginPage) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Turns any backend/network error into a readable message
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.errors?.length) {
      return data.errors.map((e: { msg: string }) => e.msg).join('. ');
    }
    if (data?.message) return data.message;
    if (!error.response) return 'Cannot reach the server. Is the backend running?';
  }
  return 'Something went wrong. Please try again.';
}

export default api;