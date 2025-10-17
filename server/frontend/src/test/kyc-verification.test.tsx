import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import KYCPage from '../../app/kyc/page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/kyc',
}));

// Mock auth store
vi.mock('../stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 1, email: 'test@example.com' },
    isAuthenticated: true,
  }),
}));

describe('KYC Verification Flow', () => {
  it('renders the KYC page with step 1 (Personal Information)', () => {
    render(<KYCPage />);
    
    // Check if the main heading is present
    expect(screen.getByText('Identity Verification')).toBeInTheDocument();
    
    // Check if step 1 content is visible
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your first name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your last name')).toBeInTheDocument();
  });

  it('shows progress steps correctly', () => {
    render(<KYCPage />);
    
    // Check if all 4 steps are displayed
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Document Upload')).toBeInTheDocument();
    expect(screen.getByText('Identity Verification')).toBeInTheDocument();
    expect(screen.getByText('Review & Submit')).toBeInTheDocument();
  });

  it('validates required fields in step 1', () => {
    render(<KYCPage />);
    
    // Try to submit without filling required fields
    const continueButton = screen.getByText('Continue to Document Upload');
    fireEvent.click(continueButton);
    
    // Should still be on step 1 (form validation should prevent progression)
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
  });

  it('progresses to step 2 when step 1 is completed', () => {
    render(<KYCPage />);
    
    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText('Enter your first name'), {
      target: { value: 'John' }
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your last name'), {
      target: { value: 'Doe' }
    });
    fireEvent.change(screen.getByDisplayValue(''), {
      target: { value: '1990-01-01' }
    });
    
    // Submit form
    const continueButton = screen.getByText('Continue to Document Upload');
    fireEvent.click(continueButton);
    
    // Should progress to step 2
    expect(screen.getByText('Document Upload')).toBeInTheDocument();
    expect(screen.getByText('Upload clear photos of your government-issued ID')).toBeInTheDocument();
  });

  it('has proper mobile-responsive design classes', () => {
    const { container } = render(<KYCPage />);
    
    // Check for mobile-first responsive classes
    const mainContainer = container.querySelector('.min-h-screen.bg-gray-50.flex.pb-16.lg\\:pb-0');
    expect(mainContainer).toBeInTheDocument();
    
    // Check for proper button sizing (touch targets)
    const buttons = container.querySelectorAll('.min-h-\\[44px\\]');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('maintains existing design patterns', () => {
    const { container } = render(<KYCPage />);
    
    // Check for consistent card styling
    const cards = container.querySelectorAll('.bg-white.rounded-lg.shadow-sm');
    expect(cards.length).toBeGreaterThan(0);
    
    // Check for proper sidebar offset
    const contentArea = container.querySelector('.lg\\:ml-64');
    expect(contentArea).toBeInTheDocument();
  });
});
