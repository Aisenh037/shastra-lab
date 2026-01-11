import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StreakFreeze } from './StreakFreeze';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ 
        data: [{ 
          id: '1', 
          freeze_count: 2, 
          last_freeze_date: '2024-01-10',
          created_at: '2024-01-01'
        }], 
        error: null 
      }))
    })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
    })),
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ 
      data: { user: { id: 'test-user-id' } }, 
      error: null 
    }))
  }
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

// Mock toast notifications
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

describe('StreakFreeze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render streak freeze component', () => {
    render(<StreakFreeze />);

    expect(screen.getByText(/Streak Freeze/i)).toBeInTheDocument();
  });

  it('should display available freeze count', async () => {
    render(<StreakFreeze />);

    await waitFor(() => {
      expect(screen.getByText(/2.*available/i)).toBeInTheDocument();
    });
  });

  it('should show freeze button when freezes are available', async () => {
    render(<StreakFreeze />);

    await waitFor(() => {
      const freezeButton = screen.getByRole('button', { name: /freeze.*streak/i });
      expect(freezeButton).toBeInTheDocument();
      expect(freezeButton).not.toBeDisabled();
    });
  });

  it('should disable freeze button when no freezes available', async () => {
    // Mock no freezes available
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ 
          data: [{ 
            id: '1', 
            freeze_count: 0, 
            last_freeze_date: '2024-01-10',
            created_at: '2024-01-01'
          }], 
          error: null 
        }))
      })),
    });

    render(<StreakFreeze />);

    await waitFor(() => {
      const freezeButton = screen.getByRole('button', { name: /freeze.*streak/i });
      expect(freezeButton).toBeDisabled();
    });
  });

  it('should use a freeze when button is clicked', async () => {
    render(<StreakFreeze />);

    await waitFor(() => {
      const freezeButton = screen.getByRole('button', { name: /freeze.*streak/i });
      expect(freezeButton).toBeInTheDocument();
    });

    const freezeButton = screen.getByRole('button', { name: /freeze.*streak/i });
    fireEvent.click(freezeButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('daily_practice_streaks');
    });
  });

  it('should show confirmation dialog before using freeze', async () => {
    render(<StreakFreeze />);

    await waitFor(() => {
      const freezeButton = screen.getByRole('button', { name: /freeze.*streak/i });
      fireEvent.click(freezeButton);
    });

    // Should show confirmation dialog
    expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirm/i)).toBeInTheDocument();
    expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
  });

  it('should cancel freeze when cancel is clicked', async () => {
    render(<StreakFreeze />);

    await waitFor(() => {
      const freezeButton = screen.getByRole('button', { name: /freeze.*streak/i });
      fireEvent.click(freezeButton);
    });

    const cancelButton = screen.getByText(/Cancel/i);
    fireEvent.click(cancelButton);

    // Dialog should close without using freeze
    await waitFor(() => {
      expect(screen.queryByText(/Are you sure/i)).not.toBeInTheDocument();
    });
  });

  it('should confirm freeze when confirm is clicked', async () => {
    render(<StreakFreeze />);

    await waitFor(() => {
      const freezeButton = screen.getByRole('button', { name: /freeze.*streak/i });
      fireEvent.click(freezeButton);
    });

    const confirmButton = screen.getByText(/Confirm/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockSupabase.from().update).toHaveBeenCalled();
    });
  });

  it('should show success message after using freeze', async () => {
    render(<StreakFreeze />);

    await waitFor(() => {
      const freezeButton = screen.getByRole('button', { name: /freeze.*streak/i });
      fireEvent.click(freezeButton);
    });

    const confirmButton = screen.getByText(/Confirm/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Streak Frozen'),
        })
      );
    });
  });

  it('should display freeze history', async () => {
    render(<StreakFreeze />);

    await waitFor(() => {
      expect(screen.getByText(/Last freeze/i)).toBeInTheDocument();
      expect(screen.getByText('2024-01-10')).toBeInTheDocument();
    });
  });

  it('should handle errors gracefully', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: new Error('Database error') 
        }))
      })),
    });

    render(<StreakFreeze />);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Error'),
          variant: 'destructive'
        })
      );
    });
  });

  it('should show loading state initially', () => {
    render(<StreakFreeze />);

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('should explain freeze functionality', () => {
    render(<StreakFreeze />);

    expect(screen.getByText(/protect.*streak/i)).toBeInTheDocument();
  });

  it('should show freeze limit information', async () => {
    render(<StreakFreeze />);

    await waitFor(() => {
      expect(screen.getByText(/maximum.*per month/i)).toBeInTheDocument();
    });
  });
});