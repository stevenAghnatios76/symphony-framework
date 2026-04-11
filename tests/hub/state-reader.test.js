import { describe, expect, it, beforeAll } from 'vitest';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '../..');

let readSymphonyState;

beforeAll(async () => {
  const mod = await import('../../_symphony/hub/state-reader.js');
  readSymphonyState = mod.readSymphonyState;
});

describe('state-reader', () => {
  describe('readSymphonyState()', () => {
    it('exports a readSymphonyState function', () => {
      expect(typeof readSymphonyState).toBe('function');
    });

    it('returns an object with all expected top-level keys', () => {
      const state = readSymphonyState(root);
      expect(state).toHaveProperty('framework');
      expect(state).toHaveProperty('lifecycle');
      expect(state).toHaveProperty('sprint');
      expect(state).toHaveProperty('conductor');
      expect(state).toHaveProperty('memory');
      expect(state).toHaveProperty('trello');
    });

    it('reads framework state from global.yaml', () => {
      const state = readSymphonyState(root);
      expect(state.framework.name).toBe('Symphony');
      expect(state.framework.version).toBeDefined();
      expect(state.framework.enabled).toBe(true);
    });

    it('reads hub config', () => {
      const state = readSymphonyState(root);
      expect(state.framework.hub.port).toBe(3100);
    });

    it('reads lifecycle phases from lifecycle-sequence.yaml', () => {
      const state = readSymphonyState(root);
      expect(state.lifecycle.phases).toContain('1-analysis');
      expect(state.lifecycle.phases).toContain('5-deployment');
    });

    it('reads all workflows grouped by phase', () => {
      const state = readSymphonyState(root);
      expect(state.lifecycle.workflows).toBeDefined();
      expect(state.lifecycle.workflows['1-analysis']).toBeInstanceOf(Array);
      expect(state.lifecycle.workflows['1-analysis'].length).toBeGreaterThan(0);
    });

    it('reads commands from lifecycle-sequence with helper data', () => {
      const state = readSymphonyState(root);
      const brainstorm = state.lifecycle.commands.find(c => c.id === 'brainstorm');
      expect(brainstorm).toBeDefined();
      expect(brainstorm.command).toBe('/symphony-brainstorm');
      expect(brainstorm.phase).toBe('1-analysis');
    });

    it('detects current phase from artifact existence', () => {
      const state = readSymphonyState(root);
      expect(state.lifecycle.currentPhase).toBeDefined();
    });

    it('reads trello integration config', () => {
      const state = readSymphonyState(root);
      expect(state.trello.enabled).toBe(false);
      expect(state.trello.columns).toBeDefined();
    });

    it('reads conductor routing log (empty if no log exists)', () => {
      const state = readSymphonyState(root);
      expect(state.conductor.routingLog).toBeInstanceOf(Array);
    });

    it('reads memory sidecar list', () => {
      const state = readSymphonyState(root);
      expect(state.memory.sidecars).toBeInstanceOf(Array);
      expect(state.memory.sidecars).toContain('conductor-sidecar');
    });

    it('handles missing optional files gracefully', () => {
      expect(() => readSymphonyState(root)).not.toThrow();
    });
  });
});
