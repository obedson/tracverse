import { describe, it, expect, beforeEach } from 'vitest';
import api from '../lib/api';

describe('Authentication System', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'testpass123'
  };

  beforeEach(() => {
    // Clear any existing tokens
    localStorage.removeItem('auth_token');
  });

  it('should register a new user successfully', async () => {
    const response = await api.register(testUser);
    
    expect(response).toBeDefined();
    expect(response.message).toContain('success');
  });

  it('should login with valid credentials', async () => {
    // First register the user
    await api.register(testUser);
    
    // Then login
    const response = await api.login({
      email: testUser.email,
      password: testUser.password
    });
    
    expect(response).toBeDefined();
    expect(response.token).toBeDefined();
    expect(response.user).toBeDefined();
    expect(response.user.email).toBe(testUser.email);
  });

  it('should fail login with invalid credentials', async () => {
    try {
      await api.login({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      });
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.response.status).toBe(400);
    }
  });

  it('should get user profile with valid token', async () => {
    // Register and login
    await api.register(testUser);
    const loginResponse = await api.login(testUser);
    
    // Store token
    localStorage.setItem('auth_token', loginResponse.token);
    
    // Get profile
    const profile = await api.getProfile();
    expect(profile).toBeDefined();
    expect(profile.email).toBe(testUser.email);
  });
});
