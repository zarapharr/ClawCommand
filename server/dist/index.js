import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import http from 'http';
import { setupGatewayProxy } from './gateway-proxy.js';
import { setupRestProxies } from './rest-proxies.js';
import { setupFileReaders } from './file-readers.js';
import { setupDockerApi } from './docker-api.js';
import { setupSystemMetrics } from './system-metrics.js';
import { errorHandler, validateEnv } from './middleware.js';
dotenv.config({ path: '.env' });
const app = express();
const PORT = process.env.PROXY_SERVER_PORT || 8000;
const HOST = process.env.PROXY_SERVER_HOST || '127.0.0.1';
// Middleware
app.use(cors({ origin: 'http://127.0.0.1:*', credentials: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('combined'));
// Validation on startup
validateEnv();
// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
// Setup API routes
setupRestProxies(app);
setupFileReaders(app);
setupDockerApi(app);
setupSystemMetrics(app);
// Error handling
app.use(errorHandler);
// Create HTTP server for WebSocket upgrade
const server = http.createServer(app);
// Setup WebSocket proxy
setupGatewayProxy(server);
// Start server
server.listen(Number(PORT), HOST, () => {
    console.log(`✓ ClawCommand backend listening on ws://${HOST}:${PORT}`);
    console.log(`✓ REST API: http://${HOST}:${PORT}/api/*`);
    console.log(`✓ Health: http://${HOST}:${PORT}/health`);
});
// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n✓ Shutting down gracefully...');
    server.close(() => {
        console.log('✓ Server closed');
        process.exit(0);
    });
});
export default app;
//# sourceMappingURL=index.js.map