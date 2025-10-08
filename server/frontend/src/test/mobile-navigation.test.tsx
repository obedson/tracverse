import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import BottomNavigation from '../components/navigation/BottomNavigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

describe('BottomNavigation', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
  });

  it('renders all navigation items', () => {
    render(<BottomNavigation />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Earnings')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights active tab', () => {
    render(<BottomNavigation />);
    
    const dashboardButton = screen.getByLabelText('Dashboard');
    expect(dashboardButton).toHaveClass('text-blue-600');
  });

  it('navigates on tab click', () => {
    render(<BottomNavigation />);
    
    fireEvent.click(screen.getByLabelText('Team'));
    expect(mockPush).toHaveBeenCalledWith('/team');
  });

  it('has proper touch targets (44px minimum)', () => {
    render(<BottomNavigation />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('min-h-[44px]');
      expect(button).toHaveClass('min-w-[44px]');
    });
  });
});
