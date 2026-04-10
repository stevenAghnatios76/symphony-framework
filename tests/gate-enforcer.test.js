import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { XMLParser } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');
const parser = new XMLParser({ ignoreAttributes: false, allowBooleanAttributes: true, preserveOrder: true });

const filePath = '_symphony/core/engine/gate-enforcer.xml';

describe('Gate Enforcer runtime (Spec 2b)', () => {
  it('exists and parses as well-formed XML', () => {
    expect(existsSync(resolve(root, filePath))).toBe(true);
    expect(() => parser.parse(readText(filePath))).not.toThrow();
  });

  it('has status runtime', () => {
    expect(readText(filePath)).toContain('<status>runtime</status>');
  });

  it('has mandates block', () => {
    expect(readText(filePath)).toContain('<mandates>');
  });

  it('has flow with step elements', () => {
    const text = readText(filePath);
    expect(text).toContain('<flow>');
    const stepMatches = text.match(/<step\s/g) || [];
    expect(stepMatches.length).toBeGreaterThanOrEqual(3);
  });

  it('references adaptive gate substitutions and §2.8', () => {
    const text = readText(filePath);
    expect(text).toMatch(/IR-|OR-|SR-/);
    expect(text).toContain('§2.8');
  });

  it('declares HALT on failure behavior', () => {
    expect(readText(filePath)).toMatch(/HALT|halt/);
  });

  it('handles both pre-start and post-complete phases', () => {
    const text = readText(filePath);
    expect(text).toContain('pre-start');
    expect(text).toContain('post-complete');
  });
});
