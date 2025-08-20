import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;
const N8N_BACKEND_URL = 'https://workflow-lg9z.onrender.com';

// Serve static files from Vite build
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy configuration for n8n
const n8nProxy = createProxyMiddleware({
  target: N8N_BACKEND_URL,
  changeOrigin: true,
  secure: true,
  followRedirects: true,
  logLevel: 'info',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} to ${N8N_BACKEND_URL}${req.url}`);
    
    // Remove problematic headers that might cause issues
    proxyReq.removeHeader('x-forwarded-host');
    proxyReq.removeHeader('x-forwarded-proto');
    
    // Set proper headers for n8n
    proxyReq.setHeader('Host', new URL(N8N_BACKEND_URL).host);
    proxyReq.setHeader('Origin', N8N_BACKEND_URL);
    proxyReq.setHeader('Referer', N8N_BACKEND_URL);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Response from n8n: ${proxyRes.statusCode}`);
    
    // Remove frame-busting headers to allow embedding
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    
    // Handle redirects by rewriting location headers
    if (proxyRes.headers.location) {
      proxyRes.headers.location = proxyRes.headers.location.replace(N8N_BACKEND_URL, '');
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error occurred');
  }
});

// Proxy routes for n8n
app.use('/workflow-editor', n8nProxy);
app.use('/api', n8nProxy);
app.use('/rest', n8nProxy);
app.use('/webhook', n8nProxy);
app.use('/webhooks', n8nProxy);
app.use('/form', n8nProxy);
app.use('/static', n8nProxy);
app.use('/css', n8nProxy);
app.use('/js', n8nProxy);
app.use('/assets', n8nProxy);

// Special route for workflow page - redirect to n8n root
app.get('/workflow', (req, res) => {
  res.redirect('/workflow-editor');
});

// Catch-all handler: send back React's index.html file for SPA routing
app.get('*', (req, res) => {
  // If it looks like an n8n request, proxy it
  if (req.url.includes('n8n') || req.url.includes('webhook') || req.url.includes('form')) {
    return n8nProxy(req, res);
  }
  
  // Otherwise serve the React app
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
  console.log(`📊 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 n8n Proxy: http://localhost:${PORT}/workflow-editor`);
  console.log(`🎯 Proxying to: ${N8N_BACKEND_URL}`);
});

export default app;