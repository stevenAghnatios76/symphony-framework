import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');
const exists = (p) => existsSync(resolve(root, p));

describe('Memory system schemas (Spec 2b)', () => {
  describe('Checkpoint schema', () => {
    const path = '_symphony/_memory/checkpoints/SCHEMA.md';
    it('exists', () => { expect(exists(path)).toBe(true); });
    it('documents required fields', () => {
      const text = readText(path);
      expect(text).toContain('workflow_id');
      expect(text).toContain('run_id');
      expect(text).toContain('current_step_index');
      expect(text).toContain('files_touched');
      expect(text).toContain('sha256');
      expect(text).toContain('status');
    });
  });

  describe('Agent sidecar schema', () => {
    const path = '_symphony/_memory/sidecar-schema.md';
    it('exists', () => { expect(exists(path)).toBe(true); });
    it('documents decision entry format', () => {
      const text = readText(path);
      expect(text).toContain('decisions');
      expect(text).toContain('traces_to');
      expect(text).toContain('rationale');
    });
  });

  describe('Conductor sidecar schema', () => {
    const path = '_symphony/_memory/conductor-sidecar/SCHEMA.md';
    it('exists', () => { expect(exists(path)).toBe(true); });
    it('documents routing history format', () => {
      const text = readText(path);
      expect(text).toContain('routing_history');
      expect(text).toContain('confidence');
      expect(text).toContain('user_correction');
    });
  });
});
