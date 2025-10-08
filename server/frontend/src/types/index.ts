// User types
export interface User {
  id: string;
  email: string;
  referral_code: string;
  rank?: string;
  personal_volume?: number;
  team_volume?: number;
  active_status: boolean;
  created_at: string;
}

// Authentication types
export interface AuthResponse {
  message: string;
  user: User;
  sponsor?: {
    id: string;
    referral_code: string;
  };
  placement?: any;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  sponsor_code?: string;
}

// Referral types
export interface ReferralValidation {
  valid: boolean;
  message: string;
  sponsor?: {
    id: string;
    email: string;
    referral_code: string;
  };
}

export interface TreeStats {
  total_downline: number;
  direct_referrals: number;
  total_volume: number;
  active_members: number;
}

export interface TreeNode {
  id: string;
  email: string;
  referral_code: string;
  rank?: string;
  level: number;
  children?: TreeNode[];
}

// Commission types
export interface Commission {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
