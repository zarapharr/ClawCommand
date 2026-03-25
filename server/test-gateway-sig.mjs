import WebSocket from 'ws';
import crypto from 'crypto';

const GATEWAY_URL = 'ws://127.0.0.1:18789';
const GATEWAY_TOKEN = '5048528cccc8bc2eee7652dcf229b4be0ea067f12019c2db';

console.log(`Testing OpenClaw gateway with signature`);

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
    console.log('← Received:', JSON.stringify(msg, null, 2));
    
    if (msg.type === 'event' && msg.event === 'connect.challenge') {
      const nonce = msg.payload.nonce;
      const timestamp = msg.payload.ts;
      
      // Try creating signature with token + nonce
      const hmac = crypto.createHmac('sha256', GATEWAY_TOKEN);
      hmac.update(nonce);
      const signature = hmac.digest('hex');
      
      console.log(`Nonce: ${nonce}`);
      console.log(`Signature: ${signature}`);
      
      // Send challenge response with signature
      const response = {
        type: 'event',
        event: 'connect.challenge_response',
        payload: {
          nonce: nonce,
          token: GATEWAY_TOKEN,
          signature: signature,
        },
      };
      console.log('→ Sending:', JSON.stringify(response, null, 2));
      ws.send(JSON.stringify(response));
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
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
  console.log('Timeout');
  ws.close();
  process.exit(1);
}, 10000);
