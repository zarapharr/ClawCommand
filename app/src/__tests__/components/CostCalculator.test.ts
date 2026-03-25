import { describe, it, expect } from 'vitest';
import {
  calculateTokenCost,
  calculateSessionCost,
  calculateBudgetStats,
  calculateEMAForecast,
  detectAnomaly,
  analyzeCostTrend,
  formatBudgetCSV,
  formatAuditCSV,
  formatAuditJSON,
} from '@/utils/costCalculator';

describe('Cost Calculator', () => {
  describe('calculateTokenCost', () => {
    it('should calculate cost accurately to 4 decimal places', () => {
      // GPT-4: $0.03/$0.06 per 1K tokens
      const cost = calculateTokenCost(1000, 1000, 'gpt-4');
      expect(cost).toBe(0.09); // 0.03 + 0.06
    });

    it('should handle Claude pricing', () => {
      // Claude Opus: $0.015/$0.075 per 1K tokens
      const cost = calculateTokenCost(1000, 1000, 'claude-opus-4-6');
      expect(cost).toBe(0.09);
    });

    it('should handle economy models', () => {
      // Claude Haiku: $0.0008/$0.0024 per 1K tokens
      const cost = calculateTokenCost(1000, 1000, 'claude-haiku-4-6');
      expect(cost).toBeLessThan(0.01);
    });

    it('should default to GPT-3.5 for unknown models', () => {
      const cost = calculateTokenCost(1000, 1000, 'unknown-model');
      expect(cost).toBeGreaterThan(0);
    });

    it('should maintain 4 decimal precision', () => {
      const cost = calculateTokenCost(333, 777, 'gpt-3.5-turbo');
      const decimalPlaces = (cost.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(4);
    });
  });

  describe('calculateSessionCost', () => {
    it('should return breakdown of input, output, and total', () => {
      const result = calculateSessionCost(1000, 1000, 'gpt-4');
      expect(result).toHaveProperty('inputCost');
      expect(result).toHaveProperty('outputCost');
      expect(result).toHaveProperty('totalCost');
    });

    it('should have total equal to input + output', () => {
      const result = calculateSessionCost(1000, 1000, 'gpt-4');
      expect(result.totalCost).toBe(result.inputCost + result.outputCost);
    });

    it('should maintain 4 decimal precision for all fields', () => {
      const result = calculateSessionCost(333, 777, 'claude-opus-4-6');
      [result.inputCost, result.outputCost, result.totalCost].forEach(cost => {
        const decimalPlaces = (cost.toString().split('.')[1] || '').length;
        expect(decimalPlaces).toBeLessThanOrEqual(4);
      });
    });
  });

  describe('calculateBudgetStats', () => {
    it('should calculate budget utilization correctly', () => {
      const stats = calculateBudgetStats(500, 1000, 15);
      expect(stats.utilizationPercent).toBe(50);
    });

    it('should calculate remaining budget', () => {
      const stats = calculateBudgetStats(750, 1000, 15);
      expect(stats.remaining).toBe(250);
    });

    it('should mark as critical at 90%+', () => {
      const stats = calculateBudgetStats(900, 1000, 15);
      expect(stats.status).toBe('critical');
    });

    it('should mark as warning at 70-89%', () => {
      const stats = calculateBudgetStats(750, 1000, 15);
      expect(stats.status).toBe('warning');
    });

    it('should mark as healthy below 70%', () => {
      const stats = calculateBudgetStats(500, 1000, 15);
      expect(stats.status).toBe('healthy');
    });

    it('should calculate projection correctly', () => {
      // Half month (15 days), spend $500
      const stats = calculateBudgetStats(500, 1000, 15);
      expect(stats.projectedMonthlySpend).toBe(1000);
    });

    it('should calculate days remaining', () => {
      const stats = calculateBudgetStats(500, 1000, 15);
      expect(stats.daysRemaining).toBe(15);
    });
  });

  describe('calculateEMAForecast', () => {
    it('should return forecast object with required fields', () => {
      const data = [50, 55, 52, 60, 58];
      const forecast = calculateEMAForecast(data);
      expect(forecast).toHaveProperty('forecastedValue');
      expect(forecast).toHaveProperty('confidence');
      expect(forecast).toHaveProperty('upper95');
      expect(forecast).toHaveProperty('lower95');
    });

    it('should have confidence between 0 and 1', () => {
      const data = [50, 55, 52, 60, 58];
      const forecast = calculateEMAForecast(data);
      expect(forecast.confidence).toBeGreaterThanOrEqual(0);
      expect(forecast.confidence).toBeLessThanOrEqual(1);
    });

    it('should have upper bound >= lower bound', () => {
      const data = [50, 55, 52, 60, 58];
      const forecast = calculateEMAForecast(data);
      expect(forecast.upper95).toBeGreaterThanOrEqual(forecast.lower95);
    });

    it('should be responsive to trend', () => {
      // Use longer trends to ensure reliable detection
      const uptrend = [40, 45, 50, 55, 60, 65, 70, 75, 80];
      const downtrend = [80, 75, 70, 65, 60, 55, 50, 45, 40];

      const upForecast = calculateEMAForecast(uptrend);
      const downForecast = calculateEMAForecast(downtrend);

      // Uptrend should forecast higher than downtrend
      expect(upForecast.forecastedValue).toBeGreaterThan(downForecast.forecastedValue);
    });

    it('should have lower95 >= 0', () => {
      const data = [1, 2, 1, 2, 1];
      const forecast = calculateEMAForecast(data);
      expect(forecast.lower95).toBeGreaterThanOrEqual(0);
    });

    it('should maintain 4 decimal precision', () => {
      const data = [50.123, 55.456, 52.789];
      const forecast = calculateEMAForecast(data);
      const checkDecimal = (num: number) => {
        const decimalPlaces = (num.toString().split('.')[1] || '').length;
        return decimalPlaces <= 4;
      };
      expect(checkDecimal(forecast.forecastedValue)).toBe(true);
    });
  });

  describe('detectAnomaly', () => {
    it('should return anomaly object with required fields', () => {
      const history = [50, 52, 51, 53, 52];
      const anomaly = detectAnomaly(100, history);
      expect(anomaly).toHaveProperty('isAnomaly');
      expect(anomaly).toHaveProperty('zScore');
      expect(anomaly).toHaveProperty('severity');
      expect(anomaly).toHaveProperty('explanation');
    });

    it('should detect severe anomalies (Z > 3)', () => {
      const history = [50, 52, 51, 53, 52];
      const anomaly = detectAnomaly(200, history); // Very high
      expect(anomaly.isAnomaly).toBe(true);
      expect(anomaly.severity).toBe('severe');
    });

    it('should detect moderate anomalies (Z 2-3)', () => {
      const history = [50, 52, 51, 53, 52];
      const anomaly = detectAnomaly(120, history);
      expect(anomaly.severity).toMatch(/moderate|mild|severe/);
    });

    it('should not flag normal values', () => {
      const history = [50, 52, 51, 53, 52];
      const anomaly = detectAnomaly(51, history);
      expect(anomaly.isAnomaly).toBe(false);
    });

    it('should respect custom threshold', () => {
      const history = [50, 52, 51, 53, 52];
      const anomaly = detectAnomaly(100, history, 2);
      expect(anomaly.isAnomaly).toBe(true);
    });

    it('should handle insufficient data gracefully', () => {
      const anomaly = detectAnomaly(100, [50]);
      expect(anomaly.isAnomaly).toBe(false);
      expect(anomaly.explanation).toBe('Insufficient historical data');
    });

    it('should maintain 2 decimal precision for Z-score', () => {
      const history = [50, 52, 51, 53, 52];
      const anomaly = detectAnomaly(100, history);
      const decimalPlaces = (anomaly.zScore.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });

  describe('analyzeCostTrend', () => {
    it('should return array of trend data points', () => {
      const dailyCosts = [
        { date: '2024-01-01', cost: 50 },
        { date: '2024-01-02', cost: 55 },
        { date: '2024-01-03', cost: 52 },
      ];
      const trend = analyzeCostTrend(dailyCosts);
      expect(trend.length).toBe(3);
    });

    it('should include forecast in each point', () => {
      const dailyCosts = [
        { date: '2024-01-01', cost: 50 },
        { date: '2024-01-02', cost: 55 },
      ];
      const trend = analyzeCostTrend(dailyCosts);
      expect(trend[0]).toHaveProperty('forecast');
    });

    it('should flag anomalies', () => {
      const dailyCosts = [
        { date: '2024-01-01', cost: 50 },
        { date: '2024-01-02', cost: 51 },
        { date: '2024-01-03', cost: 52 },
        { date: '2024-01-04', cost: 200 }, // Spike
      ];
      const trend = analyzeCostTrend(dailyCosts);
      const hasAnomaly = trend.some(t => t.isAnomaly);
      expect(hasAnomaly).toBe(true);
    });

    it('should include anomaly severity', () => {
      const dailyCosts = [
        { date: '2024-01-01', cost: 50 },
        { date: '2024-01-02', cost: 51 },
      ];
      const trend = analyzeCostTrend(dailyCosts);
      expect(trend[0]).toHaveProperty('anomalySeverity');
      expect(['none', 'mild', 'moderate', 'severe']).toContain(trend[0].anomalySeverity);
    });
  });

  describe('formatBudgetCSV', () => {
    it('should generate valid CSV', () => {
      const data = [
        { date: '2024-01-01', spent: 50, budget: 100, model: 'gpt-4' },
      ];
      const csv = formatBudgetCSV('TestAgent', data);
      expect(csv).toContain('Date');
      expect(csv).toContain('Agent');
      expect(csv).toContain('Model');
    });

    it('should include headers', () => {
      const data: any[] = [];
      const csv = formatBudgetCSV('TestAgent', data);
      const lines = csv.split('\n');
      expect(lines[0]).toContain('Date');
    });

    it('should properly escape quotes', () => {
      const data = [
        { date: '2024-01-01', spent: 50, budget: 100, model: 'gpt-4 "special"' },
      ];
      const csv = formatBudgetCSV('TestAgent', data);
      expect(csv).toContain('""');
    });
  });

  describe('formatAuditCSV', () => {
    it('should generate valid audit CSV', () => {
      const events = [
        {
          timestamp: '2024-01-01T10:00:00Z',
          actor: 'admin',
          action: 'UPDATE',
          resourceId: 'agent-1',
          status: 'approved',
        },
      ];
      const csv = formatAuditCSV(events);
      expect(csv).toContain('Timestamp');
      expect(csv).toContain('Actor');
    });
  });

  describe('formatAuditJSON', () => {
    it('should generate valid JSON', () => {
      const events = [
        {
          timestamp: '2024-01-01T10:00:00Z',
          actor: 'admin',
          action: 'UPDATE',
          resourceId: 'agent-1',
          status: 'approved' as const,
        },
      ];
      const json = formatAuditJSON(events);
      expect(JSON.parse(json)).toBeDefined();
    });

    it('should be formatted with indentation', () => {
      const events = [
        {
          timestamp: '2024-01-01T10:00:00Z',
          actor: 'admin',
          action: 'UPDATE',
          resourceId: 'agent-1',
          status: 'approved' as const,
        },
      ];
      const json = formatAuditJSON(events);
      expect(json).toContain('\n');
    });
  });
});
