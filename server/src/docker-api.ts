import { Express, Request, Response } from 'express';
import Docker from 'dockerode';

const socketPath = process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock';

let docker: Docker | null = null;

function getDocker(): Docker {
  if (!docker) {
    docker = new Docker({ socketPath });
  }
  return docker;
}

export function setupDockerApi(app: Express) {
  // List containers
  app.get('/api/docker/containers', async (_req: Request, res: Response) => {
    try {
      const docker = getDocker();
      const containers = await docker.listContainers({ all: true });

      const formatted = containers.map((c) => ({
        id: c.Id,
        name: c.Names?.[0]?.replace(/^\//, ''),
        image: c.Image,
        status: c.Status,
        state: c.State,
        ports: c.Ports?.map((p) => ({
          ip: p.IP,
          privatePort: p.PrivatePort,
          publicPort: p.PublicPort,
          type: p.Type,
        })),
      }));

      res.json(formatted);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get container stats
  app.get('/api/docker/stats/:containerId', async (req: Request, res: Response) => {
    try {
      const { containerId } = req.params;
      const docker = getDocker();
      const container = docker.getContainer(containerId);

      const stats = await new Promise<any>((resolve, reject) => {
        let buffer = '';
        container.stats({ stream: false }, (err: any, stream: any) => {
          if (err) {
            reject(err);
            return;
          }

          stream.on('data', (chunk: Buffer) => {
            buffer += chunk.toString();
          });

          stream.on('end', () => {
            try {
              const statsObj = JSON.parse(buffer);
              resolve(statsObj);
            } catch (error) {
              reject(error);
            }
          });

          stream.on('error', reject);
        });
      });

      // Parse CPU and memory
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const cpuPercent = (cpuDelta / systemDelta) * 100;

      const memoryUsage = stats.memory_stats.usage || 0;
      const memoryLimit = stats.memory_stats.limit || 0;

      res.json({
        cpu_percent: cpuPercent.toFixed(2),
        memory_usage: memoryUsage,
        memory_limit: memoryLimit,
        memory_percent: ((memoryUsage / memoryLimit) * 100).toFixed(2),
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Summary stats for all containers
  app.get('/api/docker/stats', async (_req: Request, res: Response) => {
    try {
      const docker = getDocker();
      const containers = await docker.listContainers();

      const statsPromises = containers
        .filter((c) => c.State === 'running')
        .map((c) =>
          docker
            .getContainer(c.Id)
            .stats({ stream: false })
            .then((stream: any) => {
              return new Promise<any>((resolve) => {
                let buffer = '';
                stream.on('data', (chunk: Buffer) => {
                  buffer += chunk.toString();
                });
                stream.on('end', () => {
                  try {
                    const stats = JSON.parse(buffer);
                    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
                    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
                    const cpuPercent = (cpuDelta / systemDelta) * 100;
                    const memUsage = stats.memory_stats.usage || 0;
                    const memLimit = stats.memory_stats.limit || 0;

                    resolve({
                      id: c.Id,
                      name: c.Names?.[0]?.replace(/^\//, ''),
                      cpu_percent: parseFloat(cpuPercent.toFixed(2)),
                      memory_usage: memUsage,
                      memory_limit: memLimit,
                      memory_percent: parseFloat(((memUsage / memLimit) * 100).toFixed(2)),
                    });
                  } catch {
                    resolve(null);
                  }
                });
                stream.on('error', () => resolve(null));
              });
            })
            .catch(() => Promise.resolve(null))
        );

      const allStats = (await Promise.all(statsPromises)).filter((s) => s !== null);

      res.json({
        timestamp: new Date().toISOString(),
        containers: allStats,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  console.log('✓ Docker API routes initialized');
}
