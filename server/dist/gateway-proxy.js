import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';
const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:18789';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '';
function uuid() {
    return crypto.randomUUID();
}
class GatewayProxyManager {
    constructor(server) {
        this.gatewayWs = null;
        this.pendingMessages = [];
        this.clientConnections = new Set();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.authenticated = false;
        this.wss = new WebSocketServer({ server, path: '/ws' });
        this.setupClientHandler();
        this.connectToGateway();
    }
    setupClientHandler() {
        this.wss.on('connection', (clientWs) => {
            console.log('✓ Client WebSocket connected');
            this.clientConnections.add(clientWs);
            this.flushPendingMessages();
            clientWs.on('message', (data) => {
                if (this.gatewayWs && this.gatewayWs.readyState === WebSocket.OPEN && this.authenticated) {
                    this.gatewayWs.send(data);
                }
                else {
                    this.queueMessage('binary', data);
                }
            });
            clientWs.on('close', () => {
                console.log('✓ Client WebSocket disconnected');
                this.clientConnections.delete(clientWs);
            });
            clientWs.on('error', (err) => {
                console.error('Client WS error:', err.message);
                this.clientConnections.delete(clientWs);
            });
        });
    }
    connectToGateway() {
        console.log(`→ Connecting to gateway: ${GATEWAY_URL}`);
        this.authenticated = false;
        this.gatewayWs = new WebSocket(GATEWAY_URL, {
            headers: {
                'Authorization': `Bearer ${GATEWAY_TOKEN}`,
                'Host': '127.0.0.1:18789',
            },
            origin: undefined,
        });
        this.gatewayWs.on('open', () => {
            console.log('✓ Gateway WebSocket opened, waiting for challenge...');
        });
        this.gatewayWs.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                // Handle connect.challenge: gateway sends nonce, we respond with JSON-RPC connect frame
                if (msg.type === 'event' && msg.event === 'connect.challenge') {
                    const nonce = msg.payload?.nonce;
                    console.log(`→ Received connect.challenge (nonce: ${nonce})`);
                    this.sendConnectFrame();
                    return;
                }
                // Handle connect response (type: "res" for our connect request)
                if (msg.type === 'res' && !this.authenticated) {
                    if (msg.ok) {
                        console.log('✓ Gateway authenticated (connect.ready)');
                        this.authenticated = true;
                        this.reconnectAttempts = 0;
                        this.flushPendingMessages();
                    }
                    else {
                        console.error(`✗ Gateway connect rejected: ${msg.error?.message || 'unknown error'}`);
                        console.error(`  Code: ${msg.error?.code}, Details:`, JSON.stringify(msg.error?.details));
                    }
                    return;
                }
                // Forward all other messages to browser clients
                if (this.authenticated) {
                    this.broadcastToClients(data);
                }
            }
            catch {
                // Non-JSON frame, forward as-is
                if (this.authenticated) {
                    this.broadcastToClients(data);
                }
            }
        });
        this.gatewayWs.on('close', (code, reason) => {
            const reasonStr = reason?.toString() || '';
            console.log(`! Gateway connection closed (code: ${code}, reason: ${reasonStr})`);
            this.gatewayWs = null;
            this.authenticated = false;
            this.scheduleReconnect();
        });
        this.gatewayWs.on('error', (err) => {
            console.error('✗ Gateway error:', err.message);
        });
    }
    sendConnectFrame() {
        if (!this.gatewayWs || this.gatewayWs.readyState !== WebSocket.OPEN)
            return;
        const connectFrame = {
            type: 'req',
            id: uuid(),
            method: 'connect',
            params: {
                minProtocol: 3,
                maxProtocol: 3,
                client: {
                    id: 'gateway-client',
                    version: '1.0.0',
                    platform: 'node',
                    mode: 'backend',
                },
                role: 'operator',
                scopes: ['operator.admin'],
                auth: {
                    token: GATEWAY_TOKEN,
                },
            },
        };
        console.log('→ Sending connect frame (method: connect, role: operator)');
        this.gatewayWs.send(JSON.stringify(connectFrame));
    }
    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            console.log(`→ Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
            this.reconnectAttempts++;
            setTimeout(() => this.connectToGateway(), delay);
        }
        else {
            console.error('✗ Max reconnection attempts reached, giving up');
        }
    }
    queueMessage(type, data) {
        this.pendingMessages.push({ type, data, timestamp: Date.now() });
        if (this.pendingMessages.length > 1000) {
            this.pendingMessages.shift();
        }
    }
    flushPendingMessages() {
        if (!this.gatewayWs || this.gatewayWs.readyState !== WebSocket.OPEN || !this.authenticated)
            return;
        while (this.pendingMessages.length > 0) {
            const msg = this.pendingMessages.shift();
            if (msg)
                this.gatewayWs.send(msg.data);
        }
    }
    broadcastToClients(data) {
        this.clientConnections.forEach((clientWs) => {
            if (clientWs.readyState === WebSocket.OPEN)
                clientWs.send(data);
        });
    }
}
export function setupGatewayProxy(server) {
    new GatewayProxyManager(server);
}
//# sourceMappingURL=gateway-proxy.js.map