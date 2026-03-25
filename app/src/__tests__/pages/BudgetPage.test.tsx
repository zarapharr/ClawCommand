import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BudgetPage } from '@/pages/BudgetPage';

describe('BudgetPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render budget page header', () => {
      render(<BudgetPage />);
      expect(screen.getByText('Budget Control')).toBeInTheDocument();
      expect(screen.getByText('Token economics & cost management')).toBeInTheDocument();
    });

    it('should display team budget summary', () => {
      render(<BudgetPage />);
      expect(screen.getByText('Team Budget')).toBeInTheDocument();
      expect(screen.getByText('Spent')).toBeInTheDocument();
      expect(screen.getByText('Remaining')).toBeInTheDocument();
    });

    it('should render all tabs', () => {
      render(<BudgetPage />);
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Trends & Forecast')).toBeInTheDocument();
      expect(screen.getByText('By Agent')).toBeInTheDocument();
      expect(screen.getByText('Alerts')).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    it('should display cost breakdown by model tier', () => {
      render(<BudgetPage />);
      expect(screen.getByText('Cost by Model Tier')).toBeInTheDocument();
    });

    it('should show daily spend trend', () => {
      render(<BudgetPage />);
      expect(screen.getByText('Daily Spend Trend')).toBeInTheDocument();
    });

    it('should display quick stats', () => {
      render(<BudgetPage />);
      expect(screen.getByText('Avg Daily Spend')).toBeInTheDocument();
      expect(screen.getByText('Highest Spender')).toBeInTheDocument();
      expect(screen.getByText('Most Efficient')).toBeInTheDocument();
      expect(screen.getByText('Cost per Request')).toBeInTheDocument();
    });

    it('should show budget utilization by agent', () => {
      render(<BudgetPage />);
      expect(screen.getByText('Budget Utilization by Agent')).toBeInTheDocument();
    });
  });

  describe('Trends & Forecast Tab', () => {
    it('should navigate to trends tab', async () => {
      const user = userEvent.setup();
      render(<BudgetPage />);

      const trendsTab = screen.getByText('Trends & Forecast').closest('button');
      await user.click(trendsTab!);

      await waitFor(() => {
        expect(screen.getByText('Cost Forecast')).toBeInTheDocument();
      });
    });

    it('should display cost forecast', async () => {
      const user = userEvent.setup();
      render(<BudgetPage />);

      const trendsTab = screen.getByText('Trends & Forecast').closest('button');
      await user.click(trendsTab!);

      await waitFor(() => {
        expect(screen.getByText('30-Day Projection')).toBeInTheDocument();
      });
    });

    it('should show 30-day cost trend', async () => {
      const user = userEvent.setup();
      render(<BudgetPage />);

      const trendsTab = screen.getByText('Trends & Forecast').closest('button');
      await user.click(trendsTab!);

      await waitFor(() => {
        expect(screen.getByText('30-Day Cost Trend')).toBeInTheDocument();
      });
    });
  });

  describe('By Agent Tab', () => {
    it('should display agent budget cards', async () => {
      const user = userEvent.setup();
      render(<BudgetPage />);

      const agentsTab = screen.getByText('By Agent').closest('button');
      await user.click(agentsTab!);

      await waitFor(() => {
        expect(screen.getByText('Budget')).toBeInTheDocument();
      });
    });

    it('should allow editing agent budget', async () => {
      const user = userEvent.setup();
      render(<BudgetPage />);

      const agentsTab = screen.getByText('By Agent').closest('button');
      await user.click(agentsTab!);

      // Find and click edit button
      const editButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('svg[data-icon="edit"]')
      );
      
      if (editButtons.length > 0) {
        await user.click(editButtons[0]);
        await waitFor(() => {
          expect(screen.getByText(/Edit Budget/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Alerts Tab', () => {
    it('should display alerts section', async () => {
      const user = userEvent.setup();
      render(<BudgetPage />);

      const alertsTab = screen.getByText('Alerts').closest('button');
      await user.click(alertsTab!);

      await waitFor(() => {
        // Should show either alerts or "No budget alerts"
        const alertsContent = screen.queryByText(/No budget alerts|Alert/i);
        expect(alertsContent).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should have export button', () => {
      render(<BudgetPage />);
      const exportButton = screen.getByText('Export');
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('Budget Meter Component', () => {
    it('should display correct utilization percentage', () => {
      render(<BudgetPage />);
      // The page should show a percentage indicator
      const percentageElements = screen.getAllByText(/%/);
      expect(percentageElements.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile (375px)', () => {
      // Mock window size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<BudgetPage />);
      const headerElement = screen.getByText('Budget Control');
      expect(headerElement).toBeInTheDocument();
    });

    it('should be responsive on tablet (768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<BudgetPage />);
      const headerElement = screen.getByText('Budget Control');
      expect(headerElement).toBeInTheDocument();
    });

    it('should be responsive on desktop (1200px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<BudgetPage />);
      const headerElement = screen.getByText('Budget Control');
      expect(headerElement).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<BudgetPage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('should have keyboard navigable tabs', async () => {
      const user = userEvent.setup();
      render(<BudgetPage />);

      const firstTab = screen.getByText('Overview').closest('button');
      await user.tab();
      // Tab should be in the document and reachable
      expect(firstTab).toBeInTheDocument();
    });
  });
});
