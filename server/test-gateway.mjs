import WebSocket from 'ws';

const GATEWAY_URL = 'ws://127.0.0.1:18789';
const GATEWAY_TOKEN = '5048528cccc8bc2eee7652dcf229b4be0ea067f12019c2db';

console.log(`Testing gateway connection to ${GATEWAY_URL}`);
console.log(`Token: ${GATEWAY_TOKEN.substring(0, 8)}...`);

const ws = new WebSocket(GATEWAY_URL, {
  headers: {
    'Authorization': `Bearer ${GATEWAY_TOKEN}`,
  },
  handshakeTimeout: 5000,
});

ws.on('open', () => {
  console.log('✓ Connected successfully');
  console.log('Sending ping...');
  ws.send(JSON.stringify({ type: 'ping' }));
});

ws.on('message', (data) => {
  console.log('← Message received:', data.toString());
});

ws.on('close', (code, reason) => {
  console.log(`Connection closed: code=${code}, reason=${reason}`);
  process.exit(0);
});

ws.on('error', (err) => {
  console.error('✗ Error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('Timeout: No response from gateway');
  ws.close();
  process.exit(1);
}, 10000);
