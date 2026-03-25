/**
 * API Endpoint Definitions
 * Covers Factory Floor, Workflow, Budget, and Audit endpoints
 */

export const API_ENDPOINTS = {
  // Factory Floor
  factoryFloor: {
    getStatus: "/api/factory-floor/status",
    getAgents: "/api/factory-floor/agents",
    getAgent: (id: string) => `/api/factory-floor/agents/${id}`,
    getWorkflows: "/api/factory-floor/workflows",
    getMetrics: "/api/factory-floor/metrics",
  },

  // Workflows
  workflows: {
    list: "/api/workflows",
    create: "/api/workflows",
    get: (id: string) => `/api/workflows/${id}`,
    update: (id: string) => `/api/workflows/${id}`,
    delete: (id: string) => `/api/workflows/${id}`,
    start: (id: string) => `/api/workflows/${id}/start`,
    pause: (id: string) => `/api/workflows/${id}/pause`,
    resume: (id: string) => `/api/workflows/${id}/resume`,
    cancel: (id: string) => `/api/workflows/${id}/cancel`,
    retry: (id: string) => `/api/workflows/${id}/retry`,
  },

  // Budget
  budget: {
    getCurrentPeriod: "/api/budget/current",
    getPeriod: (period: string) => `/api/budget/${period}`,
    getCategories: "/api/budget/categories",
    getCategory: (id: string) => `/api/budget/categories/${id}`,
    getForecast: "/api/budget/forecast",
    createExpense: "/api/budget/expenses",
    updateExpense: (id: string) => `/api/budget/expenses/${id}`,
    approveExpense: (id: string) => `/api/budget/expenses/${id}/approve`,
    rejectExpense: (id: string) => `/api/budget/expenses/${id}/reject`,
  },

  // Audit
  audit: {
    getLogs: "/api/audit/logs",
    getLog: (id: string) => `/api/audit/logs/${id}`,
    search: "/api/audit/search",
    export: "/api/audit/export",
  },

  // Health & Status
  health: {
    status: "/api/health/status",
    readiness: "/api/health/ready",
    liveness: "/api/health/live",
  },
} as const;

/**
 * Mock API base URL for development
 * Set REACT_APP_API_MOCK=true in .env to use mock server
 */
export const getMockBaseUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3001";
  }
  return "";
};

/**
 * Get actual API base URL from environment or default
 */
export const getApiBaseUrl = () => {
  const mock = process.env.REACT_APP_API_MOCK === "true";
  if (mock) {
    return getMockBaseUrl();
  }
  return process.env.REACT_APP_API_URL || "/api";
};
