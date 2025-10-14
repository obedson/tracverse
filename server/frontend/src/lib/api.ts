import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      withCredentials: true, // Enable cookies for enterprise auth
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private refreshPromise: Promise<any> | null = null;

  private setupInterceptors() {
    // Request interceptor - cookies handled automatically
    this.client.interceptors.request.use(
      (config) => {
        // Enterprise auth uses cookies, but keep token fallback for compatibility
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        
        // Only handle 401 (unauthorized), not 403 (forbidden)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // Prevent multiple refresh requests
          if (!this.refreshPromise) {
            this.refreshPromise = this.client.post('/auth-enterprise/refresh')
              .finally(() => {
                this.refreshPromise = null;
              });
          }
          
          try {
            await this.refreshPromise;
            // Retry original request
            return this.client.request(originalRequest);
          } catch (refreshError) {
            // Clear auth and redirect to login
            console.log('Token refresh failed, but continuing...');
            // TODO: Re-enable redirect after fixing cookie issues
            // if (typeof window !== 'undefined') {
            //   localStorage.removeItem('user');
            //   localStorage.removeItem('auth_token');
            //   window.location.href = '/login';
            // }
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    const response = await this.client.post('/auth-enterprise/login', credentials);
    return response.data;
  }

  async register(data: { email: string; password: string; sponsor_code?: string }) {
    const response = await this.client.post('/auth-enterprise/register', data);
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

  // PP Wallet endpoints
  async getPPBalance() {
    const response = await this.client.get('/pp-wallet/balance');
    return response.data;
  }

  // Membership Plans endpoints
  async getMembershipPlans() {
    const response = await this.client.get('/membership-plans');
    return response.data;
  }

  // Earnings Cap endpoints
  async getEarningsCapStatus() {
    const response = await this.client.get('/earnings-cap/status');
    return response.data;
  }

  // Token management
  async refreshToken() {
    const response = await this.client.post('/auth-enterprise/refresh');
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/auth-enterprise/logout');
    return response.data;
  }
}

export const api = new ApiClient();
export default api;
