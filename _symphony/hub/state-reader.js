import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parse as parseYaml } from 'yaml';

function readYaml(filePath) {
  if (!existsSync(filePath)) return null;
  return parseYaml(readFileSync(filePath, 'utf8'));
}

function pathExists(p) { return existsSync(p); }

function readFrameworkState(symphonyRoot) {
  const global = readYaml(join(symphonyRoot, '_config', 'global.yaml')) || {};
  const manifest = readYaml(join(symphonyRoot, '_config', 'manifest.yaml')) || {};
  return {
    name: global.framework_name || 'Symphony',
    version: global.framework_version || 'unknown',
    enabled: global.symphony?.enabled ?? true,
    hub: { port: global.hub?.port ?? 3100, auto_refresh: global.hub?.auto_refresh ?? true, refresh_interval_ms: global.hub?.refresh_interval_ms ?? 2000 },
    modules: manifest.modules || {},
    adapters: manifest.adapters || {},
    limits: global.limits || {},
  };
}

function detectPhase(docsRoot) {
  const planning = join(docsRoot, 'planning-artifacts');
  const implementation = join(docsRoot, 'implementation-artifacts');
  if (!pathExists(join(planning, 'product-brief.md'))) return '1-analysis';
  if (!pathExists(join(planning, 'prd.md'))) return '2-planning';
  if (!pathExists(join(planning, 'architecture.md'))) return '3-solutioning';
  if (pathExists(join(implementation, 'sprint-status.md'))) return '4-implementation';
  return '5-deployment';
}

function readLifecycleState(symphonyRoot, docsRoot) {
  const sequence = readYaml(join(symphonyRoot, '_config', 'lifecycle-sequence.yaml')) || {};
  const phases = ['1-analysis', '2-planning', '3-solutioning', '4-implementation', '5-deployment', 'anytime'];
  const workflows = {};
  const commands = [];
  for (const [id, entry] of Object.entries(sequence)) {
    const phase = entry.phase || 'anytime';
    if (!workflows[phase]) workflows[phase] = [];
    workflows[phase].push(id);
    commands.push({ id, command: entry.command, phase, next: entry.next || {} });
  }
  return { phases: phases.filter(p => p !== 'anytime'), workflows, commands, currentPhase: detectPhase(docsRoot) };
}

function readSprintState(docsRoot) {
  const implRoot = join(docsRoot, 'implementation-artifacts');
  const storiesDir = join(implRoot, 'stories');
  const stories = [];
  if (pathExists(storiesDir)) {
    for (const file of readdirSync(storiesDir)) {
      if (!file.endsWith('.md')) continue;
      const content = readFileSync(join(storiesDir, file), 'utf8');
      const statusMatch = content.match(/status:\s*(.+)/i);
      const titleMatch = content.match(/title:\s*(.+)/i);
      stories.push({ id: file.replace('.md', ''), title: titleMatch?.[1]?.trim() || file, status: statusMatch?.[1]?.trim() || 'unknown' });
    }
  }
  return { exists: pathExists(join(implRoot, 'sprint-status.md')), stories, total: stories.length, done: stories.filter(s => s.status === 'done').length, current: stories.find(s => s.status === 'in-progress') || null };
}

function readConductorState(symphonyRoot) {
  const log = readYaml(join(symphonyRoot, '_memory', 'conductor-sidecar', 'routing-log.yaml'));
  return { routingLog: Array.isArray(log) ? log : [], lastRouting: Array.isArray(log) && log.length > 0 ? log[log.length - 1] : null };
}

function readMemoryState(symphonyRoot) {
  const memoryRoot = join(symphonyRoot, '_memory');
  const sidecars = [];
  if (pathExists(memoryRoot)) { for (const entry of readdirSync(memoryRoot, { withFileTypes: true })) { if (entry.isDirectory()) sidecars.push(entry.name); } }
  const checkpointsDir = join(memoryRoot, 'checkpoints');
  const checkpoints = [];
  if (pathExists(checkpointsDir)) { for (const file of readdirSync(checkpointsDir)) { if (file.endsWith('.yaml')) checkpoints.push(file.replace('.yaml', '')); } }
  return { sidecars, checkpoints, activeWorkflow: checkpoints.length > 0 };
}

function readTrelloState(symphonyRoot) {
  const global = readYaml(join(symphonyRoot, '_config', 'global.yaml')) || {};
  const trelloConfig = global.integrations?.trello || {};
  return { enabled: trelloConfig.enabled ?? false, board_id: trelloConfig.board_id || '', columns: trelloConfig.columns || {}, configured: !!(trelloConfig.enabled && trelloConfig.board_id) };
}

export function readSymphonyState(projectRoot) {
  const symphonyRoot = resolve(projectRoot, '_symphony');
  const docsRoot = resolve(projectRoot, 'docs');
  return { framework: readFrameworkState(symphonyRoot), lifecycle: readLifecycleState(symphonyRoot, docsRoot), sprint: readSprintState(docsRoot), conductor: readConductorState(symphonyRoot), memory: readMemoryState(symphonyRoot), trello: readTrelloState(symphonyRoot), timestamp: new Date().toISOString() };
}
