import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { XMLParser } from 'fast-xml-parser';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');
const readYaml = (p) => YAML.parse(readText(p));

const parser = new XMLParser({
  ignoreAttributes: false,
  allowBooleanAttributes: true,
  preserveOrder: true,
});

const parseXml = (relPath) => {
  const text = readText(relPath);
  return parser.parse(text);
};

describe('Symphony engine XML — parse validity', () => {
  const engineFiles = [
    '_symphony/core/engine/workflow-engine.xml',
    '_symphony/core/engine/task-runner.xml',
    '_symphony/core/engine/protocols/preflight-check.xml',
    '_symphony/core/engine/protocols/variable-resolution.xml',
    '_symphony/core/engine/protocols/planning-gate.xml',
  ];

  for (const file of engineFiles) {
    it(`${file} exists and parses as well-formed XML`, () => {
      expect(existsSync(resolve(root, file))).toBe(true);
      expect(() => parseXml(file)).not.toThrow();
    });
  }
});
