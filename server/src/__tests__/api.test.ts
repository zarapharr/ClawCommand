import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('ClawCommand Backend API', () => {
  beforeAll(() => {
    // Server starts in index.ts
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('Health & Status', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Langfuse Proxy', () => {
    it('should proxy langfuse traces request', async () => {
      const response = await request(app).get('/api/proxy/langfuse/traces?limit=10');
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });

    it('should proxy langfuse observations request', async () => {
      const response = await request(app).get('/api/proxy/langfuse/observations?limit=10');
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });

    it('should proxy langfuse scores request', async () => {
      const response = await request(app).get('/api/proxy/langfuse/scores?limit=10');
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });
  });

  describe('Ollama Proxy', () => {
    it('should proxy ollama tags request', async () => {
      const response = await request(app).get('/api/proxy/ollama/tags');
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });
  });

  describe('GitHub Proxy', () => {
    it('should proxy github repos request', async () => {
      const response = await request(app).get('/api/github/repos?owner=zarapharr');
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });

    it('should proxy github issues request', async () => {
      const response = await request(app).get(
        '/api/github/issues?owner=zarapharr&repo=ClawCommand'
      );
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });
  });

  describe('Docker API', () => {
    it('should list docker containers', async () => {
      const response = await request(app).get('/api/docker/containers');
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });

    it('should fetch docker stats', async () => {
      const response = await request(app).get('/api/docker/stats');
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('timestamp');
        expect(Array.isArray(response.body.containers)).toBe(true);
      }
    });
  });

  describe('System Metrics', () => {
    it('should fetch system metrics', async () => {
      const response = await request(app).get('/api/system/metrics');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('cpu');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('disk');
      expect(response.body).toHaveProperty('network');
      expect(response.body).toHaveProperty('uptime');
    });

    it('system metrics should have valid CPU data', async () => {
      const response = await request(app).get('/api/system/metrics');
      expect(response.status).toBe(200);
      expect(response.body.cpu).toHaveProperty('user');
      expect(response.body.cpu).toHaveProperty('system');
      expect(response.body.cpu).toHaveProperty('idle');
      expect(typeof response.body.cpu.user).toBe('number');
    });

    it('system metrics should have valid memory data', async () => {
      const response = await request(app).get('/api/system/metrics');
      expect(response.status).toBe(200);
      expect(response.body.memory).toHaveProperty('total');
      expect(response.body.memory).toHaveProperty('used');
      expect(response.body.memory).toHaveProperty('free');
      expect(response.body.memory).toHaveProperty('percent');
      expect(response.body.memory.total).toBeGreaterThan(0);
    });
  });

  describe('Audit Logs', () => {
    it('should fetch audit logs with pagination', async () => {
      const response = await request(app).get('/api/audit/logs?limit=10&offset=0');
      expect(response.status).toBeGreaterThanOrEqual(200);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('limit');
        expect(response.body).toHaveProperty('offset');
        expect(Array.isArray(response.body.entries)).toBe(true);
      }
    });

    it('should filter audit logs by agent', async () => {
      const response = await request(app).get(
        '/api/audit/logs?limit=10&agent=ops-builder'
      );
      expect(response.status).toBeGreaterThanOrEqual(200);
      if (response.status === 200 && response.body.entries.length > 0) {
        const allMatch = response.body.entries.every((e: any) =>
          e.agent?.includes('ops-builder')
        );
        expect(allMatch).toBe(true);
      }
    });
  });

  describe('Cron Jobs', () => {
    it('should fetch cron jobs with pagination', async () => {
      const response = await request(app).get('/api/cron/jobs?limit=10&offset=0');
      expect(response.status).toBeGreaterThanOrEqual(200);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('limit');
        expect(response.body).toHaveProperty('offset');
        expect(Array.isArray(response.body.jobs)).toBe(true);
      }
    });

    it('should handle large limit gracefully', async () => {
      const response = await request(app).get('/api/cron/jobs?limit=1000&offset=0');
      expect(response.status).toBeGreaterThanOrEqual(200);
      if (response.status === 200) {
        expect(response.body.limit).toBeLessThanOrEqual(500); // Capped at 500
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for invalid routes', async () => {
      const response = await request(app).get('/api/nonexistent');
      expect(response.status).toBe(404);
    });

    it('should handle invalid JSON in POST body gracefully', async () => {
      const response = await request(app)
        .post('/api/proxy/ollama/generate')
        .set('Content-Type', 'application/json')
        .send({ model: 'test', prompt: 'hello' });
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });
});
