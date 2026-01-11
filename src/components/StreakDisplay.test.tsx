import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test-utils';
import { StreakDisplay } from './StreakDisplay';

describe('StreakDisplay', () => {
  describe('Card variant (default)', () => {
    it('should render current streak and longest streak', () => {
      renderWithProviders(
        <StreakDisplay
          currentStreak={5}
          longestStreak={10}
          practicedToday={false}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('Daily Streak')).toBeInTheDocument();
    });

    it('should show "Practiced today" when practicedToday is true', () => {
      renderWithProviders(
        <StreakDisplay
          currentStreak={3}
          longestStreak={5}
          practicedToday={true}
        />
      );

      expect(screen.getByText('Practiced today')).toBeInTheDocument();
    });

    it('should show "Practice today to continue!" when practicedToday is false', () => {
      renderWithProviders(
        <StreakDisplay
          currentStreak={3}
          longestStreak={5}
          practicedToday={false}
        />
      );

      expect(screen.getByText('Practice today to continue!')).toBeInTheDocument();
    });

    it('should display streak milestones when current streak > 0', () => {
      renderWithProviders(
        <StreakDisplay
          currentStreak={15}
          longestStreak={20}
          practicedToday={true}
        />
      );

      expect(screen.getByText('7d')).toBeInTheDocument();
      expect(screen.getByText('14d')).toBeInTheDocument();
      expect(screen.getByText('30d')).toBeInTheDocument();
    });

    it('should not display milestones when current streak is 0', () => {
      renderWithProviders(
        <StreakDisplay
          currentStreak={0}
          longestStreak={5}
          practicedToday={false}
        />
      );

      expect(screen.queryByText('7d')).not.toBeInTheDocument();
    });
  });

  describe('Compact variant', () => {
    it('should render in compact format', () => {
      renderWithProviders(
        <StreakDisplay
          currentStreak={7}
          longestStreak={12}
          practicedToday={true}
          variant="compact"
        />
      );

      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('day streak')).toBeInTheDocument();
      expect(screen.getByText('Best: 12 days')).toBeInTheDocument();
      expect(screen.getByText('Done today')).toBeInTheDocument();
    });

    it('should not show "Done today" when not practiced', () => {
      renderWithProviders(
        <StreakDisplay
          currentStreak={3}
          longestStreak={8}
          practicedToday={false}
          variant="compact"
        />
      );

      expect(screen.queryByText('Done today')).not.toBeInTheDocument();
    });
  });

  describe('Inline variant', () => {
    it('should render in inline format', () => {
      renderWithProviders(
        <StreakDisplay
          currentStreak={4}
          longestStreak={9}
          practicedToday={true}
          variant="inline"
        />
      );

      expect(screen.getByText('4')).toBeInTheDocument();
      // Should not show longest streak in inline variant
      expect(screen.queryByText('9')).not.toBeInTheDocument();
    });

    it('should show check circle when practiced today', () => {
      const { container } = renderWithProviders(
        <StreakDisplay
          currentStreak={2}
          longestStreak={6}
          practicedToday={true}
          variant="inline"
        />
      );

      // Check for CheckCircle icon - it's actually lucide-circle-check-big
      const checkIcon = container.querySelector('svg.lucide-circle-check-big');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  describe('Streak color logic', () => {
    it('should apply orange color for streaks >= 7', () => {
      const { container } = renderWithProviders(
        <StreakDisplay
          currentStreak={7}
          longestStreak={10}
          practicedToday={false}
        />
      );

      const flameIcon = container.querySelector('.lucide-flame');
      expect(flameIcon).toHaveClass('text-orange-500');
    });

    it('should apply amber color for streaks >= 3 and < 7', () => {
      const { container } = renderWithProviders(
        <StreakDisplay
          currentStreak={5}
          longestStreak={8}
          practicedToday={false}
        />
      );

      const flameIcon = container.querySelector('.lucide-flame');
      expect(flameIcon).toHaveClass('text-amber-500');
    });

    it('should apply muted color for streaks < 3', () => {
      const { container } = renderWithProviders(
        <StreakDisplay
          currentStreak={1}
          longestStreak={3}
          practicedToday={false}
        />
      );

      const flameIcon = container.querySelector('.lucide-flame');
      expect(flameIcon).toHaveClass('text-muted-foreground');
    });
  });

  describe('Milestone highlighting', () => {
    it('should highlight achieved milestones', () => {
      renderWithProviders(
        <StreakDisplay
          currentStreak={15}
          longestStreak={20}
          practicedToday={true}
        />
      );

      // Get the milestone elements by their text content and check their parent div
      const milestones = screen.getAllByText(/\d+d/);
      const milestone7 = milestones.find(el => el.textContent === '7d');
      const milestone14 = milestones.find(el => el.textContent === '14d');
      const milestone30 = milestones.find(el => el.textContent === '30d');

      // 7 and 14 day milestones should be highlighted (achieved)
      expect(milestone7).toHaveClass('bg-primary/10');
      expect(milestone14).toHaveClass('bg-primary/10');
      
      // 30 day milestone should not be highlighted (not achieved)
      expect(milestone30).toHaveClass('bg-muted/50');
    });
  });
});