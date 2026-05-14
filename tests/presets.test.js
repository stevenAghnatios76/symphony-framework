import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readYaml = (p) => YAML.parse(readFileSync(resolve(root, p), 'utf8'));

const presets = ['solo', 'team', 'enterprise'];

describe('Environment presets inventory (Spec 7d)', () => {
  it('has exactly 3 preset files', () => {
    let count = 0;
    for (const p of presets) {
      if (existsSync(resolve(root, `_symphony/_config/presets/${p}.yaml`))) count++;
    }
    expect(count).toBe(3);
  });
});

for (const preset of presets) {
  describe(`Preset: ${preset} (Spec 7d)`, () => {
    const path = `_symphony/_config/presets/${preset}.yaml`;

    it('exists and parses as YAML', () => {
      expect(existsSync(resolve(root, path))).toBe(true);
      const data = readYaml(path);
      expect(data).toBeTruthy();
    });

    it('has id matching filename', () => {
      expect(readYaml(path).id).toBe(preset);
    });

    it('has conductor section', () => {
      const data = readYaml(path);
      expect(data.conductor).toBeTruthy();
      expect(data.conductor.auto_dispatch_confidence).toBeGreaterThan(0);
    });

    it('has gates section', () => {
      expect(readYaml(path).gates).toBeTruthy();
    });

    it('has memory_hygiene section', () => {
      const data = readYaml(path);
      expect(data.memory_hygiene).toBeTruthy();
      expect(data.memory_hygiene.cadence).toBeTruthy();
    });

    it('has hub section', () => {
      expect(readYaml(path).hub).toBeTruthy();
    });

    it('has disciplines section', () => {
      const data = readYaml(path);
      expect(data.disciplines).toBeTruthy();
      expect(data.disciplines.self_critique_threshold).toBeGreaterThan(0);
    });
  });
}

describe('Preset tier ordering (Spec 7d)', () => {
  it('enterprise has stricter confidence than team', () => {
    const team = readYaml('_symphony/_config/presets/team.yaml');
    const enterprise = readYaml('_symphony/_config/presets/enterprise.yaml');
    expect(enterprise.conductor.auto_dispatch_confidence)
      .toBeGreaterThanOrEqual(team.conductor.auto_dispatch_confidence);
  });

  it('solo has lower confidence than team', () => {
    const solo = readYaml('_symphony/_config/presets/solo.yaml');
    const team = readYaml('_symphony/_config/presets/team.yaml');
    expect(solo.conductor.auto_dispatch_confidence)
      .toBeLessThanOrEqual(team.conductor.auto_dispatch_confidence);
  });

  it('enterprise requires security review', () => {
    const enterprise = readYaml('_symphony/_config/presets/enterprise.yaml');
    expect(enterprise.gates.security_review_required).toBe(true);
  });

  it('solo does not require code review', () => {
    const solo = readYaml('_symphony/_config/presets/solo.yaml');
    expect(solo.gates.code_review_required).toBe(false);
  });
});
