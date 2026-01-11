import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubjectAnalytics } from './SubjectAnalytics';

// Mock Recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
}));

// Mock data for testing
const mockAnalyticsData = {
  subjectPerformance: [
    { subject: 'History', score: 85, attempts: 10 },
    { subject: 'Geography', score: 78, attempts: 8 },
    { subject: 'Polity', score: 92, attempts: 12 },
  ],
  topicDistribution: [
    { topic: 'Ancient History', count: 15, percentage: 30 },
    { topic: 'Modern History', count: 10, percentage: 20 },
    { topic: 'Geography', count: 25, percentage: 50 },
  ],
  difficultyBreakdown: [
    { difficulty: 'Easy', count: 20, color: '#10B981' },
    { difficulty: 'Medium', count: 15, color: '#F59E0B' },
    { difficulty: 'Hard', count: 5, color: '#EF4444' },
  ],
};

describe('SubjectAnalytics', () => {
  it('should render analytics dashboard', () => {
    render(<SubjectAnalytics data={mockAnalyticsData} />);

    // Should render the main container
    expect(screen.getByTestId('subject-analytics')).toBeInTheDocument();
  });

  it('should display subject performance chart', () => {
    render(<SubjectAnalytics data={mockAnalyticsData} />);

    // Should render bar chart for subject performance
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('should display topic distribution', () => {
    render(<SubjectAnalytics data={mockAnalyticsData} />);

    // Should show topic information
    expect(screen.getByText('Ancient History')).toBeInTheDocument();
    expect(screen.getByText('Modern History')).toBeInTheDocument();
    expect(screen.getByText('Geography')).toBeInTheDocument();
  });

  it('should display difficulty breakdown', () => {
    render(<SubjectAnalytics data={mockAnalyticsData} />);

    // Should show difficulty levels
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    const emptyData = {
      subjectPerformance: [],
      topicDistribution: [],
      difficultyBreakdown: [],
    };

    render(<SubjectAnalytics data={emptyData} />);

    // Should still render the container
    expect(screen.getByTestId('subject-analytics')).toBeInTheDocument();
    
    // Should show appropriate empty state or handle gracefully
    expect(screen.getByText(/No data available|No analytics data/i)).toBeInTheDocument();
  });

  it('should display performance metrics correctly', () => {
    render(<SubjectAnalytics data={mockAnalyticsData} />);

    // Should display score values
    expect(screen.getByText('85')).toBeInTheDocument(); // History score
    expect(screen.getByText('78')).toBeInTheDocument(); // Geography score
    expect(screen.getByText('92')).toBeInTheDocument(); // Polity score
  });

  it('should show attempt counts', () => {
    render(<SubjectAnalytics data={mockAnalyticsData} />);

    // Should display attempt counts
    expect(screen.getByText('10')).toBeInTheDocument(); // History attempts
    expect(screen.getByText('8')).toBeInTheDocument();  // Geography attempts
    expect(screen.getByText('12')).toBeInTheDocument(); // Polity attempts
  });

  it('should render chart components', () => {
    render(<SubjectAnalytics data={mockAnalyticsData} />);

    // Should render chart elements
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('should be responsive', () => {
    render(<SubjectAnalytics data={mockAnalyticsData} />);

    // Should use responsive container
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    render(<SubjectAnalytics data={null} loading={true} />);

    // Should show loading indicator
    expect(screen.getByText(/Loading|Analyzing/i)).toBeInTheDocument();
  });

  it('should handle error state', () => {
    const errorMessage = 'Failed to load analytics data';
    render(<SubjectAnalytics data={null} error={errorMessage} />);

    // Should show error message
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});