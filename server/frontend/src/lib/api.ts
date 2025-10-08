import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    const response = await this.client.post('/auth-fixed/login', credentials);
    return response.data;
  }

  async register(data: { email: string; password: string; sponsor_code?: string }) {
    const response = await this.client.post('/auth-fixed/register', data);
    return response.data;
  }

  // User endpoints
  async getProfile() {
    const response = await this.client.get('/users/profile');
    return response.data;
  }

  async getDashboard() {
    const response = await this.client.get('/users/dashboard');
    return response.data;
  }

  // Commission endpoints
  async getCommissions() {
    const response = await this.client.get('/commissions');
    return response.data;
  }

  // Team endpoints
  async getReferrals() {
    const response = await this.client.get('/referrals');
    return response.data;
  }

  // Marketing endpoints
  async generateUrl(data: { base_url: string; platform?: string }) {
    const response = await this.client.post('/generate-url', data);
    return response.data;
  }
}

export const api = new ApiClient();
export default api;
