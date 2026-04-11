import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { readFileSync, existsSync, watch } from 'node:fs';
import { resolve, join } from 'node:path';
import { readSymphonyState } from './state-reader.js';

export function createHubServer({ projectRoot, port = 3100 }) {
  const app = new Hono();
  const publicDir = resolve(import.meta.dirname, 'public');

  // Full state endpoint
  app.get('/api/state', (c) => {
    const state = readSymphonyState(projectRoot);
    return c.json(state);
  });

  // SSE endpoint for live updates
  app.get('/api/events', (c) => {
    return c.body(
      new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();

          const state = readSymphonyState(projectRoot);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(state)}\n\n`));

          const watchers = [];
          const watchPaths = [
            resolve(projectRoot, '_symphony'),
            resolve(projectRoot, 'docs'),
          ];

          let debounceTimer = null;
          const sendUpdate = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              try {
                const updated = readSymphonyState(projectRoot);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(updated)}\n\n`));
              } catch {
                // Ignore read errors during file transitions
              }
            }, 500);
          };

          for (const dir of watchPaths) {
            if (existsSync(dir)) {
              try {
                const w = watch(dir, { recursive: true }, sendUpdate);
                watchers.push(w);
              } catch {
                // Recursive watch not supported on all platforms
              }
            }
          }

          c.req.raw.signal.addEventListener('abort', () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            for (const w of watchers) w.close();
            controller.close();
          });
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  });

  // Toggle endpoint
  app.post('/api/toggle', async (c) => {
    const globalPath = resolve(projectRoot, '_symphony', '_config', 'global.yaml');
    if (!existsSync(globalPath)) {
      return c.json({ error: 'global.yaml not found' }, 404);
    }
    const { writeFileSync } = await import('node:fs');
    let content = readFileSync(globalPath, 'utf8');
    if (content.includes('enabled: true')) {
      content = content.replace(/(\bsymphony:\s*\n\s*enabled:\s*)true/, '$1false');
    } else {
      content = content.replace(/(\bsymphony:\s*\n\s*enabled:\s*)false/, '$1true');
    }
    writeFileSync(globalPath, content, 'utf8');
    const state = readSymphonyState(projectRoot);
    return c.json({ enabled: state.framework.enabled });
  });

  // Serve index.html at root
  app.get('/', (c) => {
    const indexPath = join(publicDir, 'index.html');
    if (!existsSync(indexPath)) {
      return c.html('<html><head><title>Symphony Hub</title></head><body><h1>Symphony Hub</h1><p>Frontend not yet built.</p></body></html>');
    }
    const html = readFileSync(indexPath, 'utf8');
    return c.html(html);
  });

  // Serve static files
  app.get('/:file', (c) => {
    const fileName = c.req.param('file');
    const filePath = join(publicDir, fileName);
    if (!existsSync(filePath)) {
      return c.notFound();
    }
    const content = readFileSync(filePath, 'utf8');
    const ext = fileName.split('.').pop();
    const types = { css: 'text/css', js: 'application/javascript', html: 'text/html' };
    return c.body(content, { headers: { 'Content-Type': types[ext] || 'text/plain' } });
  });

  const server = serve({ fetch: app.fetch, port });

  return { app, server };
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith('server.js') && !process.env.VITEST) {
  const args = process.argv.slice(2);
  const portIdx = args.indexOf('--port');
  const rootIdx = args.indexOf('--project-root');
  const port = portIdx >= 0 ? parseInt(args[portIdx + 1], 10) : 3100;
  const projectRoot = rootIdx >= 0 ? resolve(args[rootIdx + 1]) : resolve('.');

  console.log(`Symphony Hub starting on http://localhost:${port}`);
  createHubServer({ projectRoot, port });

  const { exec } = await import('node:child_process');
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${cmd} http://localhost:${port}`);
}
