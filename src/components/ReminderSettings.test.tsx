import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReminderSettings } from './ReminderSettings';

// Mock the useReminders hook
const mockUseReminders = {
  reminders: [
    {
      id: '1',
      title: 'Daily Practice',
      time: '09:00',
      enabled: true,
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    {
      id: '2',
      title: 'Evening Review',
      time: '18:00',
      enabled: false,
      days: ['saturday', 'sunday']
    }
  ],
  loading: false,
  addReminder: vi.fn(),
  updateReminder: vi.fn(),
  deleteReminder: vi.fn(),
  toggleReminder: vi.fn(),
  requestNotificationPermission: vi.fn(),
  hasNotificationPermission: true,
};

vi.mock('@/hooks/useReminders', () => ({
  useReminders: () => mockUseReminders
}));

// Mock toast notifications
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

describe('ReminderSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render reminder settings component', () => {
    render(<ReminderSettings />);

    expect(screen.getByText(/Reminder Settings/i)).toBeInTheDocument();
  });

  it('should display existing reminders', () => {
    render(<ReminderSettings />);

    expect(screen.getByText('Daily Practice')).toBeInTheDocument();
    expect(screen.getByText('Evening Review')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('18:00')).toBeInTheDocument();
  });

  it('should show enabled/disabled status', () => {
    render(<ReminderSettings />);

    const enabledReminder = screen.getByText('Daily Practice').closest('[data-testid="reminder-item"]');
    const disabledReminder = screen.getByText('Evening Review').closest('[data-testid="reminder-item"]');

    expect(enabledReminder).toHaveClass(/enabled|active/);
    expect(disabledReminder).toHaveClass(/disabled|inactive/);
  });

  it('should toggle reminder when switch is clicked', async () => {
    render(<ReminderSettings />);

    const toggleSwitch = screen.getAllByRole('switch')[0];
    fireEvent.click(toggleSwitch);

    await waitFor(() => {
      expect(mockUseReminders.toggleReminder).toHaveBeenCalledWith('1');
    });
  });

  it('should open add reminder dialog', () => {
    render(<ReminderSettings />);

    const addButton = screen.getByRole('button', { name: /add.*reminder/i });
    fireEvent.click(addButton);

    expect(screen.getByText(/New Reminder/i)).toBeInTheDocument();
  });

  it('should create new reminder', async () => {
    render(<ReminderSettings />);

    // Open add dialog
    const addButton = screen.getByRole('button', { name: /add.*reminder/i });
    fireEvent.click(addButton);

    // Fill form
    const titleInput = screen.getByLabelText(/title/i);
    const timeInput = screen.getByLabelText(/time/i);
    
    fireEvent.change(titleInput, { target: { value: 'Morning Study' } });
    fireEvent.change(timeInput, { target: { value: '07:00' } });

    // Select days
    const mondayCheckbox = screen.getByLabelText(/monday/i);
    fireEvent.click(mondayCheckbox);

    // Save
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUseReminders.addReminder).toHaveBeenCalledWith({
        title: 'Morning Study',
        time: '07:00',
        enabled: true,
        days: expect.arrayContaining(['monday'])
      });
    });
  });

  it('should edit existing reminder', async () => {
    render(<ReminderSettings />);

    // Click edit button
    const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
    fireEvent.click(editButton);

    expect(screen.getByDisplayValue('Daily Practice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();

    // Update title
    const titleInput = screen.getByDisplayValue('Daily Practice');
    fireEvent.change(titleInput, { target: { value: 'Updated Practice' } });

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUseReminders.updateReminder).toHaveBeenCalledWith('1', {
        title: 'Updated Practice',
        time: '09:00',
        enabled: true,
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      });
    });
  });

  it('should delete reminder', async () => {
    render(<ReminderSettings />);

    // Click delete button
    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockUseReminders.deleteReminder).toHaveBeenCalledWith('1');
    });
  });

  it('should validate form inputs', async () => {
    render(<ReminderSettings />);

    // Open add dialog
    const addButton = screen.getByRole('button', { name: /add.*reminder/i });
    fireEvent.click(addButton);

    // Try to save without title
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    expect(screen.getByText(/title.*required/i)).toBeInTheDocument();
  });

  it('should show notification permission status', () => {
    render(<ReminderSettings />);

    if (mockUseReminders.hasNotificationPermission) {
      expect(screen.getByText(/notifications.*enabled/i)).toBeInTheDocument();
    } else {
      expect(screen.getByText(/enable.*notifications/i)).toBeInTheDocument();
    }
  });

  it('should request notification permission', async () => {
    mockUseReminders.hasNotificationPermission = false;
    
    render(<ReminderSettings />);

    const enableButton = screen.getByRole('button', { name: /enable.*notifications/i });
    fireEvent.click(enableButton);

    await waitFor(() => {
      expect(mockUseReminders.requestNotificationPermission).toHaveBeenCalled();
    });
  });

  it('should display day selection correctly', () => {
    render(<ReminderSettings />);

    // Open add dialog
    const addButton = screen.getByRole('button', { name: /add.*reminder/i });
    fireEvent.click(addButton);

    // Check all days are available
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(day => {
      expect(screen.getByLabelText(new RegExp(day, 'i'))).toBeInTheDocument();
    });
  });

  it('should handle loading state', () => {
    mockUseReminders.loading = true;
    
    render(<ReminderSettings />);

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('should format time display correctly', () => {
    render(<ReminderSettings />);

    // Should display times in readable format
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('18:00')).toBeInTheDocument();
  });

  it('should show selected days for each reminder', () => {
    render(<ReminderSettings />);

    // Should show weekdays for first reminder
    expect(screen.getByText(/Mon.*Tue.*Wed.*Thu.*Fri/)).toBeInTheDocument();
    
    // Should show weekends for second reminder
    expect(screen.getByText(/Sat.*Sun/)).toBeInTheDocument();
  });
});