import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { ThemeToggleSimple } from './ThemeToggle';

// Mock next-themes
const mockSetTheme = vi.fn();
const mockUseTheme = vi.fn(() => ({
  theme: 'light',
  setTheme: mockSetTheme,
}));

vi.mock('next-themes', async () => {
  const actual = await vi.importActual('next-themes');
  return {
    ...actual,
    useTheme: () => mockUseTheme(),
  };
});

// Wrapper component for theme provider
const ThemeWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    {children}
  </ThemeProvider>
);

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render theme toggle button', () => {
    render(
      <ThemeWrapper>
        <ThemeToggleSimple />
      </ThemeWrapper>
    );

    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();
  });

  it('should show sun icon in light mode', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    render(
      <ThemeWrapper>
        <ThemeToggleSimple />
      </ThemeWrapper>
    );

    // The sun icon should be visible (not hidden by dark: class)
    const sunIcon = screen.getByTestId('sun-icon');
    expect(sunIcon).toBeInTheDocument();
  });

  it('should show moon icon in dark mode', () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });

    render(
      <ThemeWrapper>
        <ThemeToggleSimple />
      </ThemeWrapper>
    );

    // The moon icon should be visible
    const moonIcon = screen.getByTestId('moon-icon');
    expect(moonIcon).toBeInTheDocument();
  });

  it('should toggle theme when clicked', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    render(
      <ThemeWrapper>
        <ThemeToggleSimple />
      </ThemeWrapper>
    );

    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should toggle from dark to light when clicked', () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });

    render(
      <ThemeWrapper>
        <ThemeToggleSimple />
      </ThemeWrapper>
    );

    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('should handle system theme', () => {
    mockUseTheme.mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
    });

    render(
      <ThemeWrapper>
        <ThemeToggleSimple />
      </ThemeWrapper>
    );

    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    // Should toggle to dark when system theme is active (since system !== 'dark')
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should have proper accessibility attributes', () => {
    render(
      <ThemeWrapper>
        <ThemeToggleSimple />
      </ThemeWrapper>
    );

    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toHaveAttribute('aria-label', 'Toggle theme');
  });
  });
});