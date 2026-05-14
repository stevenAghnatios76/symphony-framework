import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const exists = (p) => existsSync(resolve(root, p));
const readText = (p) => readFileSync(resolve(root, p), 'utf8');

describe('Symphony repo structure (architecture spec §4.1)', () => {
  describe('top-level repo files', () => {
    it('has package.json', () => {
      expect(exists('package.json')).toBe(true);
    });
    it('has README.md', () => {
      expect(exists('README.md')).toBe(true);
    });
    it('has CLAUDE.md', () => {
      expect(exists('CLAUDE.md')).toBe(true);
    });
    it('has LICENSE', () => {
      expect(exists('LICENSE')).toBe(true);
    });
    it('has .gitignore', () => {
      expect(exists('.gitignore')).toBe(true);
    });
    it('has bin/symphony-cli.js', () => {
      expect(exists('bin/symphony-cli.js')).toBe(true);
    });
  });

  describe('_symphony/_config', () => {
    it('has global.yaml', () => {
      expect(exists('_symphony/_config/global.yaml')).toBe(true);
    });
    it('has manifest.yaml', () => {
      expect(exists('_symphony/_config/manifest.yaml')).toBe(true);
    });
  });

  describe('_symphony/core/engine — all 5 components', () => {
    const components = [
      'conductor.xml',
      'wave-executor.xml',
      'workflow-engine.xml',
      'gate-enforcer.xml',
      'task-runner.xml',
    ];
    for (const c of components) {
      it(`has ${c}`, () => {
        expect(exists(`_symphony/core/engine/${c}`)).toBe(true);
      });
    }
  });

  describe('_symphony/core/protocols — all 9 protocols', () => {
    const protocols = [
      'status-sync.xml',
      'review-gate-check.xml',
      'checkpoint-resume.xml',
      'memory-hygiene.xml',
      'artifact-enrichment-hook.xml',
      'self-critique.xml',
      'trust-levels.xml',
      'anti-rationalization.xml',
      'diagnose-then-fix.xml',
    ];
    for (const p of protocols) {
      it(`has ${p}`, () => {
        expect(exists(`_symphony/core/protocols/${p}`)).toBe(true);
      });
    }
  });

  describe('_symphony/core/adapter-registry', () => {
    it('has claude-code.yaml', () => {
      expect(exists('_symphony/core/adapter-registry/claude-code.yaml')).toBe(true);
    });
    it('has copilot.yaml', () => {
      expect(exists('_symphony/core/adapter-registry/copilot.yaml')).toBe(true);
    });
  });

  describe('_symphony/lifecycle — 5 phase directories', () => {
    const phases = [
      '1-analysis',
      '2-planning',
      '3-solutioning',
      '4-implementation',
      '5-deployment',
    ];
    for (const phase of phases) {
      it(`has workflows/${phase}`, () => {
        expect(exists(`_symphony/lifecycle/workflows/${phase}`)).toBe(true);
      });
    }
    it('has lifecycle/agents', () => {
      expect(exists('_symphony/lifecycle/agents')).toBe(true);
    });
    it('has lifecycle/templates', () => {
      expect(exists('_symphony/lifecycle/templates')).toBe(true);
    });
  });

  describe('_symphony module directories', () => {
    const modules = [
      'dev/agents',
      'dev/skills',
      'dev/knowledge',
      'creative/agents',
      'creative/workflows',
      'testing/agents',
      'testing/workflows',
    ];
    for (const m of modules) {
      it(`has ${m}`, () => {
        expect(exists(`_symphony/${m}`)).toBe(true);
      });
    }
  });

  describe('_symphony/creative — agents and workflows (Spec 6a)', () => {
    const creativeAgents = [
      'brainstorming-coach',
      'design-thinking-coach',
      'innovation-strategist',
      'problem-solver',
      'storyteller',
      'presentation-designer',
    ];
    for (const a of creativeAgents) {
      it(`has creative agent ${a}`, () => {
        expect(exists(`_symphony/creative/agents/${a}.md`)).toBe(true);
      });
    }

    const creativeWorkflows = [
      'design-thinking',
      'innovation-strategy',
      'problem-solving',
      'creative-sprint',
      'storytelling',
      'slide-deck',
      'pitch-deck',
    ];
    for (const w of creativeWorkflows) {
      it(`has creative workflow ${w}`, () => {
        expect(exists(`_symphony/creative/workflows/${w}/workflow.yaml`)).toBe(true);
      });
    }
  });

  describe('_symphony/dev — agents, skills, knowledge (Spec 7a)', () => {
    it('has _base-dev.md', () => {
      expect(exists('_symphony/dev/agents/_base-dev.md')).toBe(true);
    });
    it('has mobile-dev.md', () => {
      expect(exists('_symphony/dev/agents/mobile-dev.md')).toBe(true);
    });

    const skills = [
      'git-workflow', 'api-design', 'database-design', 'docker-workflow',
      'testing-patterns', 'code-review-standards', 'documentation-standards',
      'security-basics', 'figma-integration', 'edge-cases', 'validation-patterns',
    ];
    for (const s of skills) {
      it(`has skill ${s}`, () => {
        expect(exists(`_symphony/dev/skills/${s}.md`)).toBe(true);
      });
    }

    const knowledgeDirs = ['typescript', 'angular', 'flutter', 'python', 'go'];
    for (const d of knowledgeDirs) {
      it(`has knowledge/${d} directory`, () => {
        expect(exists(`_symphony/dev/knowledge/${d}`)).toBe(true);
      });
    }
  });

  describe('_symphony/testing — agents, workflows, knowledge, adapters (Spec 7b)', () => {
    it('has _base-test.md', () => {
      expect(exists('_symphony/testing/agents/_base-test.md')).toBe(true);
    });

    const testingWorkflows = [
      'gap-analysis', 'performance-testing', 'mobile-testing', 'ci-setup',
      'test-review', 'fill-test-gaps', 'edit-test-plan', 'nfr-assessment',
      'test-automation', 'test-execution', 'security-testing', 'teach-me-testing',
    ];
    for (const w of testingWorkflows) {
      it(`has testing workflow ${w}`, () => {
        expect(exists(`_symphony/testing/workflows/${w}/workflow.yaml`)).toBe(true);
      });
    }

    const knowledgeDirs = ['strategies', 'frameworks', 'patterns', 'performance', 'security', 'mobile'];
    for (const d of knowledgeDirs) {
      it(`has testing knowledge/${d} directory`, () => {
        expect(exists(`_symphony/testing/knowledge/${d}`)).toBe(true);
      });
    }

    const adapterFiles = ['vitest-adapter', 'pytest-adapter', 'go-test-adapter', 'flutter-test-adapter', 'xctest-adapter'];
    for (const a of adapterFiles) {
      it(`has testing adapter ${a}`, () => {
        expect(exists(`_symphony/testing/adapters/${a}.md`)).toBe(true);
      });
    }
  });

  describe('_symphony/utility — agents (Spec 7c)', () => {
    const utilityAgents = ['critic', 'code-simplifier', 'browser-tester'];
    for (const a of utilityAgents) {
      it(`has utility agent ${a}`, () => {
        expect(exists(`_symphony/utility/agents/${a}.md`)).toBe(true);
      });
    }
  });

  describe('_symphony/lifecycle/agents/stakeholders (Spec 7c)', () => {
    it('has _persona-template.md', () => {
      expect(exists('_symphony/lifecycle/agents/stakeholders/_persona-template.md')).toBe(true);
    });
    const stakeholders = ['cto', 'product-owner', 'end-user', 'security-officer', 'qa-lead'];
    for (const s of stakeholders) {
      it(`has stakeholder persona ${s}`, () => {
        expect(exists(`_symphony/lifecycle/agents/stakeholders/${s}.md`)).toBe(true);
      });
    }
  });

  describe('_symphony/core/adapter-registry — new adapters (Spec 7c)', () => {
    const adapters = ['gemini-cli', 'cursor'];
    for (const a of adapters) {
      it(`has adapter registry ${a}.yaml`, () => {
        expect(exists(`_symphony/core/adapter-registry/${a}.yaml`)).toBe(true);
      });
    }
  });

  describe('Anytime workflows — new additions (Spec 7c)', () => {
    const newWorkflows = [
      'spike', 'explore-codebase', 'discuss', 'adversarial-review',
      'hub', 'status', 'trello-sync', 'trello-setup', 'toggle',
    ];
    for (const w of newWorkflows) {
      it(`has anytime workflow ${w}`, () => {
        expect(exists(`_symphony/lifecycle/workflows/anytime/${w}/workflow.yaml`)).toBe(true);
      });
    }
  });

  describe('_symphony/_memory', () => {
    it('has checkpoints directory', () => {
      expect(exists('_symphony/_memory/checkpoints')).toBe(true);
    });
    it('has conductor-sidecar directory', () => {
      expect(exists('_symphony/_memory/conductor-sidecar')).toBe(true);
    });
  });

  describe('_symphony/hub', () => {
    it('has hub directory', () => {
      expect(exists('_symphony/hub')).toBe(true);
    });
    it('has hub/public directory', () => {
      expect(exists('_symphony/hub/public')).toBe(true);
    });
  });

  describe('_symphony/integrations/trello', () => {
    it('has trello integration directory', () => {
      expect(exists('_symphony/integrations/trello')).toBe(true);
    });
    it('has trello templates directory', () => {
      expect(exists('_symphony/integrations/trello/templates')).toBe(true);
    });
  });

  describe('adapters/claude-code', () => {
    it('has adapter.yaml', () => {
      expect(exists('adapters/claude-code/adapter.yaml')).toBe(true);
    });
    it('has translator.js', () => {
      expect(exists('adapters/claude-code/translator.js')).toBe(true);
    });
    it('has templates/command.md.tmpl', () => {
      expect(exists('adapters/claude-code/templates/command.md.tmpl')).toBe(true);
    });
  });

  describe('adapters/copilot', () => {
    it('has adapter.yaml', () => {
      expect(exists('adapters/copilot/adapter.yaml')).toBe(true);
    });
    it('has translator.js', () => {
      expect(exists('adapters/copilot/translator.js')).toBe(true);
    });
    it('has templates/command.md.tmpl', () => {
      expect(exists('adapters/copilot/templates/command.md.tmpl')).toBe(true);
    });
  });

  describe('_symphony/dev/agents — mobile agents (Spec 7d)', () => {
    const mobileAgents = ['designer-mobile', 'mobile-tester'];
    for (const a of mobileAgents) {
      it(`has dev agent ${a}`, () => {
        expect(exists(`_symphony/dev/agents/${a}.md`)).toBe(true);
      });
    }
  });

  describe('_symphony/_config/presets (Spec 7d)', () => {
    const presets = ['solo', 'team', 'enterprise'];
    for (const p of presets) {
      it(`has preset ${p}.yaml`, () => {
        expect(exists(`_symphony/_config/presets/${p}.yaml`)).toBe(true);
      });
    }
  });

  describe('_symphony/core/protocols — workspace isolation (Spec 7d)', () => {
    it('has workspace-isolation.xml', () => {
      expect(exists('_symphony/core/protocols/workspace-isolation.xml')).toBe(true);
    });
  });

  describe('_symphony/core/vault (Spec 7d)', () => {
    const vaultFiles = ['schema.yaml', 'codebase-index.yaml', 'query-patterns.md'];
    for (const f of vaultFiles) {
      it(`has vault/${f}`, () => {
        expect(exists(`_symphony/core/vault/${f}`)).toBe(true);
      });
    }
  });

  describe('_symphony/core/cli (Spec 7d)', () => {
    it('has command-registry.yaml', () => {
      expect(exists('_symphony/core/cli/command-registry.yaml')).toBe(true);
    });
    it('has sdk-interface.yaml', () => {
      expect(exists('_symphony/core/cli/sdk-interface.yaml')).toBe(true);
    });
  });

  describe('_symphony/dev/knowledge/patterns (Spec 7d)', () => {
    const patterns = ['workspace-isolation', 'internationalization'];
    for (const p of patterns) {
      it(`has knowledge pattern ${p}`, () => {
        expect(exists(`_symphony/dev/knowledge/patterns/${p}.md`)).toBe(true);
      });
    }
  });

  describe('Anytime workflow — i18n-setup (Spec 7d)', () => {
    it('has i18n-setup workflow', () => {
      expect(exists('_symphony/lifecycle/workflows/anytime/i18n-setup/workflow.yaml')).toBe(true);
    });
  });

  describe('adapters/codex', () => {
    it('has adapter.yaml', () => {
      expect(exists('adapters/codex/adapter.yaml')).toBe(true);
    });
    it('has translator.js', () => {
      expect(exists('adapters/codex/translator.js')).toBe(true);
    });
    it('has templates/agents.md.tmpl', () => {
      expect(exists('adapters/codex/templates/agents.md.tmpl')).toBe(true);
    });
  });

  describe('_symphony/core/adapter-registry — codex (Spec 7d)', () => {
    it('has adapter registry codex.yaml', () => {
      expect(exists('_symphony/core/adapter-registry/codex.yaml')).toBe(true);
    });
  });

  describe('package.json sanity', () => {
    it('declares name as symphony-framework', () => {
      const pkg = JSON.parse(readText('package.json'));
      expect(pkg.name).toBe('symphony-framework');
    });
    it('declares bin entry for symphony-framework', () => {
      const pkg = JSON.parse(readText('package.json'));
      expect(pkg.bin['symphony-framework']).toBe('./bin/symphony-cli.js');
    });
  });
});
