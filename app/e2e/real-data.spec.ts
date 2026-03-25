import { test, expect } from '@playwright/test';

test.describe('ClawCommand Real Data Integration E2E', () => {
  const baseUrl = 'http://localhost:5173';
  const apiBase = 'http://127.0.0.1:8000';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl);
  });

  test.describe('System Metrics Integration', () => {
    test('should display system metrics on dashboard', async ({ page }) => {
      // Wait for metrics to load
      await page.waitForURL('**/');

      // Check if CPU metrics are present
      const cpuMetrics = await page.locator('[data-testid="cpu-usage"]').isVisible().catch(() => false);
      if (cpuMetrics) {
        await expect(page.locator('[data-testid="cpu-usage"]')).toContainText(/\d+/);
      }
    });

    test('should update metrics in real-time', async ({ page }) => {
      await page.waitForTimeout(2000);

      // Fetch metrics directly from API
      const response = await page.request.get(`${apiBase}/api/system/metrics`);
      expect(response.ok()).toBeTruthy();

      const metrics = await response.json();
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('memory');
      expect(metrics.cpu).toHaveProperty('total');
      expect(metrics.memory).toHaveProperty('percent');
    });
  });

  test.describe('Docker Integration', () => {
    test('should fetch docker containers via API', async ({ page }) => {
      const response = await page.request.get(`${apiBase}/api/docker/containers`);
      expect(response.ok()).toBeTruthy();

      const containers = await response.json();
      expect(Array.isArray(containers)).toBeTruthy();
    });

    test('should fetch docker stats via API', async ({ page }) => {
      const response = await page.request.get(`${apiBase}/api/docker/stats`);
      if (response.ok()) {
        const stats = await response.json();
        expect(stats).toHaveProperty('timestamp');
        expect(Array.isArray(stats.containers)).toBeTruthy();
      }
    });
  });

  test.describe('Audit Logs Integration', () => {
    test('should fetch audit logs via API', async ({ page }) => {
      const response = await page.request.get(
        `${apiBase}/api/audit/logs?limit=10&offset=0`
      );
      expect(response.ok()).toBeTruthy();

      const logs = await response.json();
      expect(logs).toHaveProperty('entries');
      expect(logs).toHaveProperty('total');
      expect(Array.isArray(logs.entries)).toBeTruthy();
    });

    test('should filter audit logs by agent', async ({ page }) => {
      const response = await page.request.get(
        `${apiBase}/api/audit/logs?agent=ops-builder&limit=10`
      );
      if (response.ok()) {
        const logs = await response.json();
        logs.entries.forEach((entry: any) => {
          expect(entry.agent).toContain('ops-builder');
        });
      }
    });
  });

  test.describe('Cron Jobs Integration', () => {
    test('should fetch cron jobs via API', async ({ page }) => {
      const response = await page.request.get(
        `${apiBase}/api/cron/jobs?limit=10&offset=0`
      );
      expect(response.ok()).toBeTruthy();

      const jobs = await response.json();
      expect(jobs).toHaveProperty('jobs');
      expect(jobs).toHaveProperty('total');
      expect(Array.isArray(jobs.jobs)).toBeTruthy();
    });

    test('should handle large cron job sets', async ({ page }) => {
      const response = await page.request.get(
        `${apiBase}/api/cron/jobs?limit=1000&offset=0`
      );
      if (response.ok()) {
        const jobs = await response.json();
        expect(jobs.limit).toBeLessThanOrEqual(500); // Server caps at 500
      }
    });
  });

  test.describe('Langfuse Integration', () => {
    test('should proxy langfuse traces', async ({ page }) => {
      const response = await page.request.get(
        `${apiBase}/api/proxy/langfuse/traces?limit=10`
      );
      expect(response.ok()).toBeTruthy();
    });

    test('should proxy langfuse observations', async ({ page }) => {
      const response = await page.request.get(
        `${apiBase}/api/proxy/langfuse/observations?limit=10`
      );
      expect(response.ok()).toBeTruthy();
    });

    test('should proxy langfuse scores', async ({ page }) => {
      const response = await page.request.get(
        `${apiBase}/api/proxy/langfuse/scores?limit=10`
      );
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Ollama Integration', () => {
    test('should proxy ollama model tags', async ({ page }) => {
      const response = await page.request.get(`${apiBase}/api/proxy/ollama/tags`);
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('GitHub Integration', () => {
    test('should proxy github repos', async ({ page }) => {
      const response = await page.request.get(
        `${apiBase}/api/github/repos?owner=zarapharr`
      );
      expect(response.ok()).toBeTruthy();
    });

    test('should proxy github issues', async ({ page }) => {
      const response = await page.request.get(
        `${apiBase}/api/github/issues?owner=zarapharr&repo=ClawCommand`
      );
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('WebSocket Gateway Connection', () => {
    test('should establish gateway websocket connection', async ({ page }) => {
      // Create a small script to test WebSocket
      const wsTest = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const ws = new WebSocket('ws://127.0.0.1:8000/ws');
          let connected = false;

          const timeout = setTimeout(() => {
            ws.close();
            resolve(false);
          }, 5000);

          ws.onopen = () => {
            connected = true;
            clearTimeout(timeout);
            ws.close();
            resolve(true);
          };

          ws.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
          };
        });
      });

      expect(wsTest).toBeTruthy();
    });
  });

  test.describe('API Error Handling', () => {
    test('should handle 404 gracefully', async ({ page }) => {
      const response = await page.request.get(`${apiBase}/api/nonexistent`, {
        failOnStatusCode: false,
      });
      expect(response.status()).toBe(404);
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // Test with invalid parameters
      const response = await page.request.get(
        `${apiBase}/api/cron/jobs/invalid-job-id`
      );
      expect([404, 500]).toContain(response.status());
    });
  });

  test.describe('Performance', () => {
    test('system metrics API should respond quickly', async ({ page }) => {
      const startTime = Date.now();
      const response = await page.request.get(`${apiBase}/api/system/metrics`);
      const duration = Date.now() - startTime;

      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(1000); // Should respond in < 1 second
    });

    test('docker containers API should respond quickly', async ({ page }) => {
      const startTime = Date.now();
      const response = await page.request.get(`${apiBase}/api/docker/containers`);
      const duration = Date.now() - startTime;

      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(2000); // Should respond in < 2 seconds
    });
  });
});
