import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusBand } from '@/components/factory-floor/StatusBand';
import { ProjectCard } from '@/components/factory-floor/ProjectCard';
import { DetailPanel } from '@/components/factory-floor/DetailPanel';
import { AlertSidebar } from '@/components/factory-floor/AlertSidebar';
import { TimelineNode } from '@/components/workflow/TimelineNode';
import { WorkflowTimeline } from '@/components/workflow/WorkflowTimeline';
import { FactoryFloorRefactored } from '@/components/factory-floor/FactoryFloorRefactored';
import { CostBadge } from '@/components/factory-floor/CostBadge';
import { ActivityFeed } from '@/components/factory-floor/ActivityFeed';

// Component tests for Phase 3B deliverables
// Testing: StatusBand, ProjectCard, DetailPanel, AlertSidebar, TimelineNode, WorkflowTimeline, FactoryFloor

describe('Phase 3B: Factory Floor & Workflow Timeline', () => {
  describe('StatusBand Component', () => {
    it('should render status counts', () => {
      render(<StatusBand running={8} paused={2} idle={12} failed={1} />);
      
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should display update timestamp', () => {
      const now = new Date();
      render(<StatusBand running={5} paused={0} idle={3} failed={0} updatedAt={now} />);
      
      expect(screen.getByText(/Updated \d+s ago/)).toBeInTheDocument();
    });

    it('should calculate percentages correctly', () => {
      render(<StatusBand running={5} paused={0} idle={5} failed={0} />);
      
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('ProjectCard Component', () => {
    it('should render project name and agent count', () => {
      render(
        <ProjectCard
          id="proj-1"
          name="BodyPulse"
          agentCount={12}
          running={8}
          paused={1}
          idle={3}
          failed={0}
          costMTD={245.32}
          status="healthy"
        />
      );

      expect(screen.getByText('BodyPulse')).toBeInTheDocument();
      expect(screen.getByText('12 agents')).toBeInTheDocument();
    });

    it('should display cost information', () => {
      render(
        <ProjectCard
          id="proj-1"
          name="Test"
          agentCount={5}
          running={3}
          paused={0}
          idle={2}
          failed={0}
          costMTD={123.45}
          status="healthy"
        />
      );

      expect(screen.getByText('$123.45')).toBeInTheDocument();
    });

    it('should show cost trend', () => {
      render(
        <ProjectCard
          id="proj-1"
          name="Test"
          agentCount={5}
          running={3}
          paused={0}
          idle={2}
          failed={0}
          costMTD={100}
          costTrend={{ direction: 'up', percent: 15 }}
          status="warning"
        />
      );

      expect(screen.getByText(/\+15%/)).toBeInTheDocument();
    });

    it('should be clickable', async () => {
      const handleClick = vi.fn();
      render(
        <ProjectCard
          id="proj-1"
          name="Test"
          agentCount={5}
          running={3}
          paused={0}
          idle={2}
          failed={0}
          costMTD={100}
          status="healthy"
          onClick={handleClick}
        />
      );

      const card = screen.getByRole('button');
      await userEvent.click(card);
      expect(handleClick).toHaveBeenCalled();
    });

    it('should render different status badges', () => {
      const statuses = ['healthy', 'warning', 'critical', 'idle'] as const;

      statuses.forEach(status => {
        const { unmount } = render(
          <ProjectCard
            id={`proj-${status}`}
            name={status}
            agentCount={5}
            running={3}
            paused={0}
            idle={2}
            failed={0}
            costMTD={100}
            status={status}
          />
        );
        
        const labels = {
          healthy: 'Healthy',
          warning: 'Warning',
          critical: 'Critical',
          idle: 'Idle',
        };
        expect(screen.getByText(labels[status])).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('DetailPanel Component', () => {
    it('should render when open', () => {
      render(
        <DetailPanel
          title="Test Project"
          open={true}
          onClose={vi.fn()}
        >
          <div>Test content</div>
        </DetailPanel>
      );

      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      const { container } = render(
        <DetailPanel
          title="Test Project"
          open={false}
          onClose={vi.fn()}
        >
          <div>Test content</div>
        </DetailPanel>
      );

      expect(container.firstChild?.childNodes.length).toBe(0);
    });

    it('should display stats when provided', () => {
      render(
        <DetailPanel
          title="Test"
          open={true}
          onClose={vi.fn()}
          executionTime={2500}
          tokensUsed={1500}
          cost={0.45}
        />
      );

      expect(screen.getByText('2.50s')).toBeInTheDocument();
      expect(screen.getByText('1,500')).toBeInTheDocument();
      expect(screen.getByText('$0.45')).toBeInTheDocument();
    });

    it('should call onClose when close button clicked', async () => {
      const handleClose = vi.fn();
      render(
        <DetailPanel
          title="Test"
          open={true}
          onClose={handleClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await userEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe('AlertSidebar Component', () => {
    it('should render alerts list', () => {
      const alerts = [
        {
          id: 'alert-1',
          severity: 'critical' as const,
          title: 'Agent failed',
          description: 'Agent-007 has failed',
          timestamp: new Date(),
        },
        {
          id: 'alert-2',
          severity: 'info' as const,
          title: 'All healthy',
          description: 'No issues detected',
          timestamp: new Date(),
        },
      ];

      render(<AlertSidebar alerts={alerts} />);

      expect(screen.getByText('Agent failed')).toBeInTheDocument();
      expect(screen.getByText('All healthy')).toBeInTheDocument();
      expect(screen.getByText('2 alerts')).toBeInTheDocument();
    });

    it('should sort by severity', () => {
      const alerts = [
        { id: '1', severity: 'info' as const, title: 'Info alert', timestamp: new Date(), description: '' },
        { id: '2', severity: 'critical' as const, title: 'Critical alert', timestamp: new Date(), description: '' },
        { id: '3', severity: 'warning' as const, title: 'Warning alert', timestamp: new Date(), description: '' },
      ];

      const { container } = render(<AlertSidebar alerts={alerts} />);
      const titles = container.querySelectorAll('h3');
      
      expect(titles[0].textContent).toBe('Critical alert');
      expect(titles[1].textContent).toBe('Warning alert');
      expect(titles[2].textContent).toBe('Info alert');
    });

    it('should call onDismiss when dismiss clicked', async () => {
      const handleDismiss = vi.fn();
      const alerts = [
        {
          id: 'alert-1',
          severity: 'warning' as const,
          title: 'Test alert',
          timestamp: new Date(),
          description: '',
        },
      ];

      render(<AlertSidebar alerts={alerts} onDismiss={handleDismiss} />);

      const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i });
      await userEvent.click(dismissButtons[0]);
      expect(handleDismiss).toHaveBeenCalledWith('alert-1');
    });
  });

  describe('TimelineNode Component', () => {
    it('should render node with title', () => {
      render(
        <TimelineNode
          id="node-1"
          title="Data Fetch"
          type="tool"
          status="complete"
          position={0.2}
        />
      );

      expect(screen.getByText('Data Fetch')).toBeInTheDocument();
    });

    it('should display status label', () => {
      const statuses = ['pending', 'running', 'complete', 'failed'] as const;

      statuses.forEach(status => {
        const { unmount } = render(
          <TimelineNode
            id={`node-${status}`}
            title={status}
            type="agent"
            status={status}
            position={0}
          />
        );

        const labels = {
          pending: 'Pending',
          running: 'Running',
          complete: 'Complete',
          failed: 'Failed',
        };
        
        expect(screen.getByText(labels[status])).toBeInTheDocument();
        unmount();
      });
    });

    it('should show duration when provided', () => {
      render(
        <TimelineNode
          id="node-1"
          title="Process"
          type="agent"
          status="complete"
          position={0.5}
          duration={2500}
        />
      );

      expect(screen.getByText('2.50s')).toBeInTheDocument();
    });

    it('should be clickable', async () => {
      const handleClick = vi.fn();
      render(
        <TimelineNode
          id="node-1"
          title="Test"
          type="agent"
          status="pending"
          position={0}
          onClick={handleClick}
        />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('CostBadge Component', () => {
    it('should render cost amount', () => {
      render(<CostBadge amount={123.45} />);

      expect(screen.getByText('$123.45')).toBeInTheDocument();
    });

    it('should display trend', () => {
      render(
        <CostBadge
          amount={100}
          trend={{ direction: 'up', percent: 15 }}
        />
      );

      expect(screen.getByText('+15%')).toBeInTheDocument();
    });
  });

  describe('ActivityFeed Component', () => {
    it('should render activity items', () => {
      const activities = [
        {
          id: '1',
          type: 'success' as const,
          title: 'Agent completed',
          timestamp: new Date(),
        },
        {
          id: '2',
          type: 'error' as const,
          title: 'Agent failed',
          timestamp: new Date(),
        },
      ];

      render(<ActivityFeed activities={activities} />);

      expect(screen.getByText('Agent completed')).toBeInTheDocument();
      expect(screen.getByText('Agent failed')).toBeInTheDocument();
    });

    it('should show empty state', () => {
      render(<ActivityFeed activities={[]} />);

      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });
  });

  describe('Integration: Factory Floor Refactored', () => {
    it('should render main sections', () => {
      render(<FactoryFloorRefactored />);

      expect(screen.getByText('Factory Floor')).toBeInTheDocument();
      expect(screen.getByText(/Running/)).toBeInTheDocument();
    });
  });

  describe('Integration: Workflow Timeline', () => {
    it('should render timeline steps', () => {
      render(<WorkflowTimeline sessionId="session-123" />);

      expect(screen.getByText('Workflow Timeline')).toBeInTheDocument();
      expect(screen.getByText('session-123')).toBeInTheDocument();
    });
  });
});
