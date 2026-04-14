/**
 * GitHub Webhook Auto-Deploy Listener
 * Listens for GitHub release events and runs update-breakdown.sh
 *
 * Setup:
 *   1. Upload to server: scp deploy-webhook.mjs gobarryco@85.234.151.224:~/deploy-webhook.mjs
 *   2. Set webhook secret: echo 'WEBHOOK_SECRET=your-secret-here' >> ~/deploy-webhook.env
 *   3. Start with PM2: pm2 start deploy-webhook.mjs --name deploy-webhook --node-args="--env-file=$HOME/deploy-webhook.env"
 *   4. Add webhook in GitHub: Settings > Webhooks > Add webhook
 *      - Payload URL: http://85.234.151.224:9876/webhook
 *      - Content type: application/json
 *      - Secret: (same as WEBHOOK_SECRET)
 *      - Events: Releases only
 */

import { createServer } from 'http';
import { createHmac } from 'crypto';
import { execFile } from 'child_process';
import { homedir } from 'os';
import { join } from 'path';

const PORT = process.env.WEBHOOK_PORT || 9876;
const SECRET = process.env.WEBHOOK_SECRET || '';
const UPDATE_SCRIPT = join(homedir(), 'update-breakdown.sh');

function verifySignature(payload, signature) {
  if (!SECRET) {
    console.warn('No WEBHOOK_SECRET set — skipping signature verification');
    return true;
  }
  if (!signature) return false;
  const expected = 'sha256=' + createHmac('sha256', SECRET).update(payload).digest('hex');
  return signature === expected;
}

function runDeploy() {
  console.log(`[${new Date().toISOString()}] Starting deployment...`);
  execFile('bash', [UPDATE_SCRIPT], { timeout: 300000 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[${new Date().toISOString()}] Deploy failed:`, error.message);
      if (stderr) console.error('STDERR:', stderr);
      return;
    }
    console.log(`[${new Date().toISOString()}] Deploy complete`);
    console.log(stdout);
  });
}

const server = createServer((req, res) => {
  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'listening', port: PORT }));
    return;
  }

  // Webhook endpoint
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      // Verify GitHub signature
      const signature = req.headers['x-hub-signature-256'];
      if (!verifySignature(body, signature)) {
        console.warn(`[${new Date().toISOString()}] Invalid signature from ${req.socket.remoteAddress}`);
        res.writeHead(403);
        res.end('Invalid signature');
        return;
      }

      try {
        const payload = JSON.parse(body);
        const event = req.headers['x-github-event'];

        // Only deploy on release creation
        if (event === 'release' && payload.action === 'created') {
          const tag = payload.release?.tag_name;
          console.log(`[${new Date().toISOString()}] Release created: ${tag}`);
          res.writeHead(200);
          res.end('Deploying');
          runDeploy();
        } else {
          res.writeHead(200);
          res.end('Ignored: ' + (event || 'unknown event'));
        }
      } catch (e) {
        console.error('Failed to parse webhook payload:', e.message);
        res.writeHead(400);
        res.end('Bad request');
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Deploy webhook listening on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log(`  Webhook: POST http://localhost:${PORT}/webhook`);
  console.log(`  Secret: ${SECRET ? 'configured' : 'NOT SET (accepting all requests)'}`);
});
