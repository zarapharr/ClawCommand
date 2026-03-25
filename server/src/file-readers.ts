import { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const AUDIT_LOGS_PATH = process.env.AUDIT_LOGS_PATH || '/Users/eric_pharr/.openclaw/workspace/logs/audit';
const CRON_JOBS_PATH = process.env.CRON_JOBS_PATH || '/Users/eric_pharr/.openclaw/.cron/jobs.json';

async function readJsonLines(filePath: string, limit: number = 100): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const entries: any[] = [];
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    rl.on('line', (line) => {
      if (line.trim()) {
        try {
          entries.push(JSON.parse(line));
          if (entries.length >= limit) {
            rl.close();
          }
        } catch (error) {
          console.error(`JSON parse error in ${filePath}:`, error);
        }
      }
    });

    rl.on('close', () => {
      resolve(entries.reverse().slice(0, limit));
    });

    rl.on('error', (error: Error) => {
      reject(error);
    });

    fileStream.on('error', (error: Error) => {
      reject(error);
    });
  });
}

export function setupFileReaders(app: Express) {
  app.get('/api/audit/logs', async (req: Request, res: Response) => {
    try {
      const { limit = 100, offset = 0, agent, action } = req.query;
      const limitNum = Math.min(parseInt(String(limit)) || 100, 1000);
      const offsetNum = parseInt(String(offset)) || 0;

      const auditDir = AUDIT_LOGS_PATH;
      if (!fs.existsSync(auditDir)) {
        return res.status(404).json({ error: 'Audit logs directory not found' });
      }

      const files = fs
        .readdirSync(auditDir)
        .filter((f) => f.endsWith('.jsonl'))
        .sort()
        .reverse();

      const allEntries: any[] = [];
      for (const file of files) {
        const filePath = path.join(auditDir, file);
        const entries = await readJsonLines(filePath, 5000);
        allEntries.push(...entries);
        if (allEntries.length > limitNum + offsetNum) break;
      }

      let filtered = allEntries;
      if (agent) {
        filtered = filtered.filter((e) => e.agent?.includes(String(agent)));
      }
      if (action) {
        filtered = filtered.filter((e) => e.action_type?.includes(String(action)));
      }

      const paginated = filtered.slice(offsetNum, offsetNum + limitNum);
      return res.json({
        total: filtered.length,
        limit: limitNum,
        offset: offsetNum,
        entries: paginated,
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.get('/api/cron/jobs', async (req: Request, res: Response) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const limitNum = Math.min(parseInt(String(limit)) || 50, 500);
      const offsetNum = parseInt(String(offset)) || 0;

      if (!fs.existsSync(CRON_JOBS_PATH)) {
        return res.status(404).json({ error: 'Cron jobs file not found' });
      }

      const jobsData = JSON.parse(fs.readFileSync(CRON_JOBS_PATH, 'utf8'));
      const jobs = jobsData.schedules || [];

      const paginated = jobs.slice(offsetNum, offsetNum + limitNum);
      return res.json({
        total: jobs.length,
        limit: limitNum,
        offset: offsetNum,
        jobs: paginated,
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.get('/api/cron/jobs/:jobId', async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;

      if (!fs.existsSync(CRON_JOBS_PATH)) {
        return res.status(404).json({ error: 'Cron jobs file not found' });
      }

      const jobsData = JSON.parse(fs.readFileSync(CRON_JOBS_PATH, 'utf8'));
      const job = jobsData.schedules?.find((j: any) => j.id === jobId);

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      return res.json(job);
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  console.log('✓ File reader routes initialized');
}
