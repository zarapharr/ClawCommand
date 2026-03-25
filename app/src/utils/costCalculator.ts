/**
 * Cost Calculation & Forecasting Utilities
 * Provides budget calculations, EMA forecasting, and anomaly detection
 * All calculations use 4 decimal place precision
 */

// Model pricing: [$0.03/$0.06] per 1K tokens (input/output)
export const modelPricing: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-opus-4-6': { input: 0.015, output: 0.075 },
  'claude-sonnet-4-6': { input: 0.003, output: 0.015 },
  'claude-haiku-4-6': { input: 0.00080, output: 0.0024 },
  'perplexity': { input: 0.002, output: 0.01 },
};

/**
 * Calculate cost for tokens used
 * Precision: 4 decimal places
 */
export function calculateTokenCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  const pricing = modelPricing[model] || modelPricing['gpt-3.5-turbo'];
  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  const total = inputCost + outputCost;
  return Math.round(total * 10000) / 10000; // 4 decimal precision
}

/**
 * Calculate session cost from token counts
 */
export function calculateSessionCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): {
  inputCost: number;
  outputCost: number;
  totalCost: number;
} {
  const pricing = modelPricing[model] || modelPricing['gpt-3.5-turbo'];
  const inputCost = Math.round((inputTokens / 1000) * pricing.input * 10000) / 10000;
  const outputCost = Math.round((outputTokens / 1000) * pricing.output * 10000) / 10000;
  const totalCost = Math.round((inputCost + outputCost) * 10000) / 10000;

  return { inputCost, outputCost, totalCost };
}

/**
 * Budget Utilization Stats
 */
export interface BudgetStats {
  spent: number;
  remaining: number;
  budget: number;
  utilizationPercent: number;
  daysRemaining: number;
  projectedMonthlySpend: number;
  status: 'healthy' | 'warning' | 'critical';
}

/**
 * Calculate budget utilization statistics
 */
export function calculateBudgetStats(
  spent: number,
  budget: number,
  daysIntoMonth: number = new Date().getDate()
): BudgetStats {
  const utilizationPercent = (spent / budget) * 100;
  const remaining = Math.round((budget - spent) * 10000) / 10000;
  const daysRemaining = 30 - daysIntoMonth;

  // Project full month spend at current daily rate
  const dailyAverage = spent / daysIntoMonth;
  const projectedMonthlySpend = Math.round(dailyAverage * 30 * 10000) / 10000;

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (utilizationPercent >= 100) status = 'critical';
  else if (utilizationPercent >= 90) status = 'critical';
  else if (utilizationPercent >= 70) status = 'warning';

  return {
    spent: Math.round(spent * 10000) / 10000,
    remaining: Math.max(0, remaining),
    budget: Math.round(budget * 10000) / 10000,
    utilizationPercent: Math.round(utilizationPercent * 100) / 100,
    daysRemaining,
    projectedMonthlySpend,
    status,
  };
}

/**
 * EMA (Exponential Moving Average) Forecast
 * Alpha (smoothing factor): 0.3 for 7-day responsive forecast
 */
export interface ForecastResult {
  forecastedValue: number;
  confidence: number; // 0-1, based on variance explained
  upper95: number;   // 95% confidence upper bound
  lower95: number;   // 95% confidence lower bound
}

export function calculateEMAForecast(
  historicalData: number[],
  periods: number = 7,
  alpha: number = 0.3
): ForecastResult {
  if (historicalData.length < 2) {
    return {
      forecastedValue: historicalData[0] ?? 0,
      confidence: 0.3,
      upper95: (historicalData[0] ?? 0) * 1.5,
      lower95: (historicalData[0] ?? 0) * 0.5,
    };
  }

  // Calculate EMA
  let ema = historicalData[0];
  const emaValues: number[] = [ema];

  for (let i = 1; i < historicalData.length; i++) {
    ema = alpha * historicalData[i] + (1 - alpha) * ema;
    emaValues.push(ema);
  }

  // Calculate trend (slope of EMA line)
  const recentEMA = emaValues.slice(-periods);
  const trend = recentEMA.reduce((sum, val, idx) => {
    return sum + val * (idx + 1);
  }, 0) / (recentEMA.length * (recentEMA.length + 1)) * 2;

  const currentEMA = emaValues[emaValues.length - 1];
  const forecastedValue = Math.round((currentEMA + trend) * 10000) / 10000;

  // Calculate variance for confidence scoring
  const mean = historicalData.reduce((a, b) => a + b) / historicalData.length;
  const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length;
  const stdDev = Math.sqrt(variance);

  // Confidence: lower variance = higher confidence (max 0.95)
  const confidence = Math.min(0.95, Math.max(0.3, 1 - stdDev / (mean || 1)));

  // 95% confidence interval (±1.96 std dev)
  const marginOfError = 1.96 * stdDev;

  return {
    forecastedValue: Math.max(0, forecastedValue),
    confidence: Math.round(confidence * 10000) / 10000,
    upper95: Math.round((forecastedValue + marginOfError) * 10000) / 10000,
    lower95: Math.round(Math.max(0, forecastedValue - marginOfError) * 10000) / 10000,
  };
}

/**
 * Anomaly Detection using Z-score
 * Z-score > 1.5 = anomaly threshold
 */
export interface AnomalyResult {
  isAnomaly: boolean;
  zScore: number;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  explanation: string;
}

export function detectAnomaly(
  value: number,
  historicalData: number[],
  threshold: number = 1.5
): AnomalyResult {
  if (historicalData.length < 2) {
    return {
      isAnomaly: false,
      zScore: 0,
      severity: 'none',
      explanation: 'Insufficient historical data',
    };
  }

  const mean = historicalData.reduce((a, b) => a + b) / historicalData.length;
  const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length;
  const stdDev = Math.sqrt(variance);

  // Avoid division by zero
  if (stdDev === 0) {
    return {
      isAnomaly: false,
      zScore: 0,
      severity: 'none',
      explanation: 'No variance in historical data',
    };
  }

  const zScore = Math.round(((value - mean) / stdDev) * 100) / 100;
  const isAnomaly = Math.abs(zScore) > threshold;

  let severity: 'none' | 'mild' | 'moderate' | 'severe' = 'none';
  if (Math.abs(zScore) > 3) severity = 'severe';
  else if (Math.abs(zScore) > 2) severity = 'moderate';
  else if (Math.abs(zScore) > 1.5) severity = 'mild';

  const explanation = isAnomaly
    ? `Cost spike detected: ${(Math.abs(zScore)).toFixed(2)}σ above baseline (${severity})`
    : `Normal: ${zScore.toFixed(2)}σ from baseline`;

  return {
    isAnomaly,
    zScore,
    severity,
    explanation,
  };
}

/**
 * Cost Trend Analysis
 */
export interface CostTrendData {
  date: string;
  cost: number;
  forecast: number;
  isAnomaly: boolean;
  anomalySeverity: 'none' | 'mild' | 'moderate' | 'severe';
}

export function analyzeCostTrend(
  dailyCosts: { date: string; cost: number }[]
  // forecastDays parameter removed - uses 7-day default internally
): CostTrendData[] {
  const costs = dailyCosts.map(d => d.cost);

  return dailyCosts.map((item, idx) => {
    const historyForAnomaly = costs.slice(Math.max(0, idx - 30), idx);
    const anomalyResult = detectAnomaly(item.cost, historyForAnomaly);

    // Simple forecast: use last 7 days
    const forecastHistory = costs.slice(Math.max(0, idx - 7), idx + 1);
    const forecast = forecastHistory.length > 0
      ? Math.round((forecastHistory.reduce((a, b) => a + b) / forecastHistory.length) * 10000) / 10000
      : item.cost;

    return {
      date: item.date,
      cost: Math.round(item.cost * 10000) / 10000,
      forecast,
      isAnomaly: anomalyResult.isAnomaly,
      anomalySeverity: anomalyResult.severity,
    };
  });
}

/**
 * Budget Export Formatting
 */
export function formatBudgetCSV(
  agentName: string,
  budgetData: Array<{
    date: string;
    spent: number;
    budget: number;
    model: string;
  }>
): string {
  const headers = ['Date', 'Agent', 'Model', 'Spent ($)', 'Budget ($)', 'Utilization (%)'];
  const rows = budgetData.map(row => {
    const util = (row.spent / row.budget) * 100;
    return [
      row.date,
      agentName,
      row.model,
      row.spent.toFixed(4),
      row.budget.toFixed(4),
      util.toFixed(2),
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Export audit log as CSV
 */
export function formatAuditCSV(
  auditEvents: Array<{
    timestamp: string;
    actor: string;
    action: string;
    resourceId: string;
    status: string;
  }>
): string {
  const headers = ['Timestamp', 'Actor', 'Action', 'Resource ID', 'Status'];
  const rows = auditEvents.map(e => [
    e.timestamp,
    e.actor,
    e.action,
    e.resourceId,
    e.status,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Export audit log as JSON
 */
export function formatAuditJSON(
  auditEvents: Array<{
    timestamp: string;
    actor: string;
    action: string;
    resourceId: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    status: string;
  }>
): string {
  return JSON.stringify(auditEvents, null, 2);
}
