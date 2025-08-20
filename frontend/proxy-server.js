import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;
const N8N_BACKEND_URL = 'https://workflow-lg9z.onrender.com';

// Serve static files from Vite build
app.use(express.static(path.join(__dirname, 'dist')));

// Simple redirect approach instead of complex proxy
app.get('/workflow', (req, res) => {
  console.log('Redirecting /workflow to n8n backend');
  res.redirect(301, N8N_BACKEND_URL);
});

app.get('/workflow-editor', (req, res) => {
  console.log('Redirecting /workflow-editor to n8n backend');
  res.redirect(301, N8N_BACKEND_URL);
});

// Catch-all handler: send back React's index.html file for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 Workflow redirect: http://localhost:${PORT}/workflow → ${N8N_BACKEND_URL}`);
});

export default app;