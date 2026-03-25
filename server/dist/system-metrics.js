import si from 'systeminformation';
let cachedMetrics = null;
let lastUpdate = 0;
const CACHE_TTL = 5000; // 5 seconds
async function getSystemMetrics() {
    const now = Date.now();
    // Return cached if fresh
    if (cachedMetrics && now - lastUpdate < CACHE_TTL) {
        return cachedMetrics;
    }
    try {
        const [cpuLoad, memInfo, diskIO, networkStats, sysTime] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.disksIO(),
            si.networkStats(),
            si.time(),
        ]);
        const netStats = networkStats[0] || { rx_sec: 0, tx_sec: 0 };
        cachedMetrics = {
            timestamp: new Date().toISOString(),
            cpu: {
                user: Math.round(cpuLoad.currentLoadUser),
                system: Math.round(cpuLoad.currentLoadSystem),
                idle: Math.round(cpuLoad.currentLoadIdle),
                total: Math.round(cpuLoad.currentLoad),
            },
            memory: {
                total: memInfo.total,
                used: memInfo.used,
                free: memInfo.free,
                percent: Math.round((memInfo.used / memInfo.total) * 10000) / 100,
            },
            disk: {
                readRate: diskIO.rIO_sec || 0,
                writeRate: diskIO.wIO_sec || 0,
            },
            network: {
                rx_sec: netStats.rx_sec || 0,
                tx_sec: netStats.tx_sec || 0,
            },
            uptime: Math.floor(sysTime.uptime),
        };
        lastUpdate = now;
        return cachedMetrics;
    }
    catch (error) {
        console.error('Error gathering system metrics:', error);
        // Return default if error
        return {
            timestamp: new Date().toISOString(),
            cpu: { user: 0, system: 0, idle: 0, total: 0 },
            memory: { total: 0, used: 0, free: 0, percent: 0 },
            disk: { readRate: 0, writeRate: 0 },
            network: { rx_sec: 0, tx_sec: 0 },
            uptime: 0,
        };
    }
}
export function setupSystemMetrics(app) {
    app.get('/api/system/metrics', async (_req, res) => {
        try {
            const metrics = await getSystemMetrics();
            res.json(metrics);
        }
        catch (error) {
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    });
    app.get('/api/system/metrics/stream', (req, res) => {
        // SSE endpoint for continuous metrics
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        const interval = setInterval(async () => {
            try {
                const metrics = await getSystemMetrics();
                res.write(`data: ${JSON.stringify(metrics)}\n\n`);
            }
            catch (error) {
                console.error('Metrics stream error:', error);
            }
        }, 5000);
        req.on('close', () => {
            clearInterval(interval);
            res.end();
        });
    });
    console.log('✓ System metrics routes initialized');
}
//# sourceMappingURL=system-metrics.js.map