export function validateEnv() {
    const required = [
        'OPENCLAW_GATEWAY_TOKEN',
        'LANGFUSE_API_KEY',
        'GITHUB_TOKEN',
    ];
    const missing = required.filter((v) => !process.env[v]);
    if (missing.length > 0) {
        console.warn(`⚠ Missing environment variables: ${missing.join(', ')}`);
        console.warn('⚠ Some features may not work correctly');
    }
    const validatedVars = {
        GATEWAY_TOKEN: process.env.OPENCLAW_GATEWAY_TOKEN ? '✓' : '✗',
        LANGFUSE_API_KEY: process.env.LANGFUSE_API_KEY ? '✓' : '✗',
        GITHUB_TOKEN: process.env.GITHUB_TOKEN ? '✓' : '✗',
    };
    console.log('Environment validation:');
    Object.entries(validatedVars).forEach(([key, status]) => {
        console.log(`  ${status} ${key}`);
    });
}
export function errorHandler(err, _req, res, _next) {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        timestamp: new Date().toISOString(),
    });
}
export function requestLogger(req, res, _next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${res.statusCode}] ${req.method} ${req.path} ${duration}ms`);
    });
}
//# sourceMappingURL=middleware.js.map