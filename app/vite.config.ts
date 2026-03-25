import path from "path"
import { execFile } from 'node:child_process'
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

function openclawBridgePlugin(): Plugin {
  const handler = (req: any, res: any) => {
    if (req.method !== 'POST' || req.url !== '/ocapi/call') return false;

    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString('utf8'); });
    req.on('end', () => {
      let parsed: { method?: string; params?: Record<string, unknown> } = {};
      try {
        parsed = body ? JSON.parse(body) : {};
      } catch {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'Invalid JSON body' }));
        return;
      }

      if (!parsed.method) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'Missing method' }));
        return;
      }

      execFile(
        'openclaw',
        ['gateway', 'call', parsed.method, '--json', '--params', JSON.stringify(parsed.params || {})],
        { timeout: 15000, maxBuffer: 2 * 1024 * 1024 },
        (error, stdout, stderr) => {
          res.setHeader('Content-Type', 'application/json');
          if (error) {
            res.statusCode = 502;
            res.end(JSON.stringify({ ok: false, error: stderr?.trim() || error.message }));
            return;
          }

          try {
            const data = JSON.parse(stdout || '{}');
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true, data }));
          } catch (parseError) {
            res.statusCode = 502;
            res.end(JSON.stringify({ ok: false, error: `Invalid gateway JSON: ${parseError instanceof Error ? parseError.message : 'unknown'}` }));
          }
        }
      );
    });

    return true;
  };

  return {
    name: 'openclaw-bridge',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (handler(req, res)) return;
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (handler(req, res)) return;
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [openclawBridgePlugin(), inspectAttr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
