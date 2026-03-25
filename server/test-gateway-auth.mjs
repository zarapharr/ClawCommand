import WebSocket from 'ws';
import crypto from 'crypto';

const GATEWAY_URL = 'ws://127.0.0.1:18789';
const GATEWAY_TOKEN = '5048528cccc8bc2eee7652dcf229b4be0ea067f12019c2db';

console.log(`Testing OpenClaw gateway challenge-response auth`);

const ws = new WebSocket(GATEWAY_URL, {
  headers: {
    'Authorization': `Bearer ${GATEWAY_TOKEN}`,
  },
  handshakeTimeout: 5000,
});

ws.on('open', () => {
  console.log('✓ WebSocket opened');
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    console.log('← Received:', msg);
    
    if (msg.type === 'event' && msg.event === 'connect.challenge') {
      console.log('Challenge nonce:', msg.payload.nonce);
      // Respond with token
      const response = {
        type: 'challenge_response',
        token: GATEWAY_TOKEN,
        nonce: msg.payload.nonce,
      };
      console.log('→ Sending response:', response);
      ws.send(JSON.stringify(response));
    }
  } catch (e) {
    console.error('Parse error:', e.message);
  }
});

ws.on('close', (code, reason) => {
  console.log(`Connection closed: code=${code}, reason=${reason}`);
  process.exit(code === 1008 ? 1 : 0);
});

ws.on('error', (err) => {
  console.error('✗ Error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('Timeout');
  ws.close();
  process.exit(1);
}, 10000);
