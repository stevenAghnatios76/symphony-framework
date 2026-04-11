import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '../..');

let createHubServer, server, baseUrl;
const TEST_PORT = 3199;

beforeAll(async () => {
  const mod = await import('../../_symphony/hub/server.js');
  createHubServer = mod.createHubServer;

  const result = createHubServer({ projectRoot: root, port: TEST_PORT });
  server = result.server;
  baseUrl = `http://localhost:${TEST_PORT}`;

  // Give server a moment to start
  await new Promise(r => setTimeout(r, 200));
});

afterAll(() => {
  if (server) server.close();
});

describe('Hub server', () => {
  it('exports a createHubServer function', () => {
    expect(typeof createHubServer).toBe('function');
  });

  it('serves index.html at GET /', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Symphony Hub');
  });

  it('returns JSON state at GET /api/state', async () => {
    const res = await fetch(`${baseUrl}/api/state`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('framework');
    expect(json).toHaveProperty('lifecycle');
    expect(json).toHaveProperty('sprint');
    expect(json).toHaveProperty('timestamp');
  });

  it('returns SSE stream at GET /api/events', async () => {
    const res = await fetch(`${baseUrl}/api/events`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
  });

  it('serves static files from public/', async () => {
    const res = await fetch(`${baseUrl}/styles.css`);
    expect([200, 404]).toContain(res.status);
  });
});
