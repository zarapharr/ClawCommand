import fetch from 'node-fetch';
const LANGFUSE_URL = process.env.LANGFUSE_BASE_URL || 'http://localhost:3000';
const LANGFUSE_API_KEY = process.env.LANGFUSE_API_KEY || '';
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_API_URL = 'https://api.github.com';
async function proxyRequest(targetUrl, method = 'GET', body, headers = {}) {
    try {
        const response = await fetch(targetUrl, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await response.json();
        return { status: response.status, data };
    }
    catch (error) {
        return {
            status: 500,
            data: { error: `Proxy error: ${error instanceof Error ? error.message : 'Unknown'}` },
        };
    }
}
export function setupRestProxies(app) {
    // Langfuse proxy
    app.get('/api/proxy/langfuse/traces', async (req, res) => {
        const { page = 1, limit = 100 } = req.query;
        const url = `${LANGFUSE_URL}/api/v1/trace?page=${page}&limit=${limit}`;
        const result = await proxyRequest(url, 'GET', undefined, {
            'Authorization': `Bearer ${LANGFUSE_API_KEY}`,
        });
        res.status(result.status).json(result.data);
    });
    app.get('/api/proxy/langfuse/observations', async (req, res) => {
        const { page = 1, limit = 100 } = req.query;
        const url = `${LANGFUSE_URL}/api/v1/observations?page=${page}&limit=${limit}`;
        const result = await proxyRequest(url, 'GET', undefined, {
            'Authorization': `Bearer ${LANGFUSE_API_KEY}`,
        });
        res.status(result.status).json(result.data);
    });
    app.get('/api/proxy/langfuse/scores', async (req, res) => {
        const { page = 1, limit = 100 } = req.query;
        const url = `${LANGFUSE_URL}/api/v1/scores?page=${page}&limit=${limit}`;
        const result = await proxyRequest(url, 'GET', undefined, {
            'Authorization': `Bearer ${LANGFUSE_API_KEY}`,
        });
        res.status(result.status).json(result.data);
    });
    // Ollama proxy
    app.get('/api/proxy/ollama/tags', async (_req, res) => {
        const result = await proxyRequest(`${OLLAMA_URL}/api/tags`, 'GET');
        res.status(result.status).json(result.data);
    });
    app.post('/api/proxy/ollama/generate', async (req, res) => {
        const result = await proxyRequest(`${OLLAMA_URL}/api/generate`, 'POST', req.body);
        res.status(result.status).json(result.data);
    });
    // GitHub proxy
    app.get('/api/github/repos', async (req, res) => {
        const { owner = 'zarapharr' } = req.query;
        const url = `${GITHUB_API_URL}/users/${owner}/repos?per_page=100`;
        const result = await proxyRequest(url, 'GET', undefined, {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
        });
        res.status(result.status).json(result.data);
    });
    app.get('/api/github/issues', async (req, res) => {
        const { owner = 'zarapharr', repo = 'ClawCommand' } = req.query;
        const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/issues?per_page=50`;
        const result = await proxyRequest(url, 'GET', undefined, {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
        });
        res.status(result.status).json(result.data);
    });
    app.get('/api/github/workflows', async (req, res) => {
        const { owner = 'zarapharr', repo = 'ClawCommand' } = req.query;
        const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/actions/workflows`;
        const result = await proxyRequest(url, 'GET', undefined, {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
        });
        res.status(result.status).json(result.data);
    });
    console.log('✓ REST proxy routes initialized');
}
//# sourceMappingURL=rest-proxies.js.map