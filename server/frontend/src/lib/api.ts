import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // Increased timeout for slow connections
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

  // Migration endpoints
  async migrateAllUsers() {
    const response = await this.client.post('/auth-migration/migrate-all-users');
    return response.data;
  }

  // User endpoints
  async getProfile() {
    const response = await this.client.get('/users/profile');
    // Handle both direct data and wrapped response
    const data = response.data;
    if (data.success && data.data) {
      // Backend returns {success: true, data: {...}}
      return data.data;
    }
    // Handle array response from backend
    return Array.isArray(data) ? data[0] : data;
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

  // Team Management APIs
  async getTeamTree() {
    const response = await this.client.get('/referrals');
    return response.data;
  }

  async getTeamStats() {
    const response = await this.client.get('/referrals/stats');
    return response.data;
  }

  async getTeamPerformance() {
    const response = await this.client.get('/analytics/team-performance');
    return response.data;
  }

  async getRankDistribution() {
    const response = await this.client.get('/analytics/rank-distribution');
    return response.data;
  }

  async getTopPerformers() {
    const response = await this.client.get('/analytics/top-performers');
    return response.data;
  }

  async getActivityTimeline() {
    const response = await this.client.get('/analytics/activity-timeline');
    return response.data;
  }

  async getTeamReports() {
    const response = await this.client.get('/analytics/team-reports');
    return response.data;
  }

  async getPerformanceComparison() {
    const response = await this.client.get('/analytics/performance-comparison');
    return response.data;
  }

  // Referral Dashboard endpoints (NEW)
  async getReferralDashboard(referralCode: string) {
    const response = await this.client.get(`/referral-dashboard/${referralCode}`);
    return response.data;
  }

  async getReferralLiveStats(referralCode: string) {
    const response = await this.client.get(`/referral-dashboard/${referralCode}/live-stats`);
    return response.data;
  }

  // QR Code endpoints (NEW)
  async generateQRCode(referralCode: string, campaign?: string) {
    const response = await this.client.post('/qr-codes/generate', {
      referral_code: referralCode,
      campaign: campaign || 'dashboard'
    });
    return response.data;
  }

  async getQRCode(referralCode: string) {
    const response = await this.client.get(`/qr-codes/${referralCode}`);
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
