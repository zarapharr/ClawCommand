import WebSocket from 'ws';

const GATEWAY_URL = 'ws://127.0.0.1:18789';
const GATEWAY_TOKEN = '5048528cccc8bc2eee7652dcf229b4be0ea067f12019c2db';

console.log(`Simple test: just wait for messages without responding`);

const ws = new WebSocket(GATEWAY_URL, {
  headers: {
    'Authorization': `Bearer ${GATEWAY_TOKEN}`,
  },
});

ws.on('open', () => {
  console.log('✓ Connected');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log('← Message:', JSON.stringify(msg));
  
  // Try just responding with the token directly
  if (msg.event === 'connect.challenge') {
    console.log('→ Sending token directly...');
    ws.send(GATEWAY_TOKEN);
  }
});

ws.on('close', (code) => {
  console.log(`Closed: ${code}`);
  process.exit(0);
});

ws.on('error', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

setTimeout(() => process.exit(0), 5000);
