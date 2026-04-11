let state = null;

// --- Navigation ---
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`panel-${btn.dataset.panel}`).classList.add('active');
  });
});

// --- SSE Connection ---
const events = new EventSource('/api/events');
events.onmessage = (e) => {
  state = JSON.parse(e.data);
  render(state);
};
events.onerror = () => {
  document.getElementById('status-text').textContent = 'Disconnected';
  document.getElementById('status-dot').classList.add('disabled');
};

// --- Render Functions ---
function render(s) {
  renderHeader(s);
  renderLifecycle(s);
  renderSprint(s);
  renderContext(s);
  renderCommands(s);
  renderMemory(s);
  renderStatus(s);
  renderFooter(s);
}

function renderHeader(s) {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  const ver = document.getElementById('version');
  if (s.framework.enabled) { dot.classList.remove('disabled'); text.textContent = 'Active'; }
  else { dot.classList.add('disabled'); text.textContent = 'Disabled'; }
  ver.textContent = `v${s.framework.version}`;
}

function renderLifecycle(s) {
  const panel = document.getElementById('panel-lifecycle');
  const phases = [
    { num: 1, name: 'Analysis', key: '1-analysis' },
    { num: 2, name: 'Planning', key: '2-planning' },
    { num: 3, name: 'Solutioning', key: '3-solutioning' },
    { num: 4, name: 'Implementation', key: '4-implementation' },
    { num: 5, name: 'Deployment', key: '5-deployment' },
  ];
  const phaseNum = parseInt(s.lifecycle.currentPhase?.charAt(0)) || 1;

  let html = '<h2>Lifecycle Progress</h2><div class="phase-track">';
  for (const p of phases) {
    const cls = p.num < phaseNum ? 'completed' : p.num === phaseNum ? 'current' : '';
    html += `<div class="phase-step ${cls}"><span class="phase-num">${p.num}</span>${p.name}</div>`;
  }
  html += '</div>';

  const currentWorkflows = s.lifecycle.workflows[s.lifecycle.currentPhase] || [];
  const nextCmd = s.conductor.lastRouting?.selected_workflow;
  html += `<h2>Phase ${phaseNum} Workflows</h2><ul class="workflow-list">`;
  for (const wf of currentWorkflows) {
    const isNext = nextCmd && wf === nextCmd;
    html += `<li class="workflow-item ${isNext ? 'next-recommended' : ''}"><span class="pending">○</span><span>${wf}</span></li>`;
  }
  html += '</ul>';
  panel.innerHTML = html;
}

function renderSprint(s) {
  const panel = document.getElementById('panel-sprint');
  const columns = { backlog: [], 'in-progress': [], 'in-review': [], done: [] };
  for (const story of s.sprint.stories) {
    const col = columns[story.status] || columns.backlog;
    col.push(story);
  }

  let html = `<h2>Sprint Board</h2><p style="color:var(--text-muted);margin-bottom:16px;font-size:13px">${s.sprint.done}/${s.sprint.total} stories done</p>`;
  html += '<div class="sprint-columns">';
  for (const [status, label] of [['backlog','Backlog'],['in-progress','In Progress'],['in-review','In Review'],['done','Done']]) {
    html += `<div class="sprint-col"><h3>${label} (${columns[status].length})</h3>`;
    for (const story of columns[status]) {
      html += `<div class="story-card"><span class="story-id">${story.id}</span><br>${story.title}</div>`;
    }
    if (columns[status].length === 0) html += '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px 0">No stories</div>';
    html += '</div>';
  }
  html += '</div>';
  panel.innerHTML = html;
}

function renderContext(s) {
  const panel = document.getElementById('panel-context');
  const maxTokens = s.framework.limits.max_tokens_per_activation || 40000;
  let html = '<h2>Context Budget</h2><p style="color:var(--text-muted);margin-bottom:16px;font-size:13px">Token limits per agent activation (from global.yaml)</p>';
  const limits = [
    { label: 'Max Tokens per Activation', value: maxTokens, max: maxTokens },
    { label: 'Agent Persona', value: s.framework.limits.max_agent_persona_lines || 200, max: 200, unit: 'lines' },
    { label: 'Instruction Step', value: s.framework.limits.max_instruction_step_lines || 150, max: 150, unit: 'lines' },
    { label: 'Skill File', value: s.framework.limits.max_skill_lines || 300, max: 300, unit: 'lines' },
    { label: 'Markdown Artifact', value: s.framework.limits.max_markdown_lines || 1000, max: 1000, unit: 'lines' },
  ];
  for (const l of limits) {
    const pct = Math.round((l.value / l.max) * 100);
    const cls = pct > 90 ? 'danger' : pct > 70 ? 'warning' : '';
    html += `<div class="budget-bar-container"><div class="budget-label">${l.label}: ${l.value.toLocaleString()}${l.unit ? ` ${l.unit}` : ' tokens'} / ${l.max.toLocaleString()}</div><div class="budget-bar"><div class="budget-fill ${cls}" style="width:${pct}%"></div></div></div>`;
  }
  panel.innerHTML = html;
}

function renderCommands(s) {
  const panel = document.getElementById('panel-commands');
  const nextCmd = s.conductor.lastRouting?.selected_workflow;
  const grouped = {};
  for (const cmd of s.lifecycle.commands) {
    const phase = cmd.phase;
    if (!grouped[phase]) grouped[phase] = [];
    grouped[phase].push(cmd);
  }
  const phaseLabels = {
    '1-analysis': 'Phase 1: Analysis', '2-planning': 'Phase 2: Planning',
    '3-solutioning': 'Phase 3: Solutioning', '4-implementation': 'Phase 4: Implementation',
    '5-deployment': 'Phase 5: Deployment', 'anytime': 'Anytime',
  };
  let html = '<h2>Command Guide</h2>';
  for (const [phase, cmds] of Object.entries(grouped)) {
    html += `<div class="cmd-group"><h3>${phaseLabels[phase] || phase}</h3>`;
    for (const cmd of cmds) {
      const isNext = nextCmd && cmd.id === nextCmd;
      const nextInfo = cmd.next?.primary ? `Next: ${cmd.next.primary}` : '';
      html += `<div class="cmd-item ${isNext ? 'next-cmd' : ''}"><code>${cmd.command}</code><span class="tip">${nextInfo}</span></div>`;
    }
    html += '</div>';
  }
  panel.innerHTML = html;
}

function renderMemory(s) {
  const panel = document.getElementById('panel-memory');
  let html = '<h2>Memory Inspector</h2>';
  html += '<h3 style="font-size:13px;color:var(--text-muted);margin-bottom:8px">Agent Sidecars</h3><ul class="sidecar-list">';
  for (const sidecar of s.memory.sidecars) html += `<li class="sidecar-item">${sidecar}/</li>`;
  html += '</ul>';
  html += '<h3 style="font-size:13px;color:var(--text-muted);margin:16px 0 8px">Conductor Routing Log</h3>';
  if (s.conductor.routingLog.length === 0) {
    html += '<p style="color:var(--text-muted);font-size:13px">No routing history yet. Run /symphony to generate entries.</p>';
  } else {
    const recent = s.conductor.routingLog.slice(-5).reverse();
    for (const entry of recent) {
      html += `<div class="workflow-item"><span>${entry.timestamp || '—'}</span><span>${entry.user_goal || '—'}</span><span style="color:var(--accent-light)">${entry.selected_workflow || '—'}</span><span style="color:var(--text-muted)">${entry.confidence || '—'}</span></div>`;
    }
  }
  html += '<h3 style="font-size:13px;color:var(--text-muted);margin:16px 0 8px">Checkpoints</h3>';
  if (s.memory.checkpoints.length === 0) html += '<p style="color:var(--text-muted);font-size:13px">No active checkpoints.</p>';
  else for (const cp of s.memory.checkpoints) html += `<div class="sidecar-item">${cp}</div>`;
  panel.innerHTML = html;
}

function renderStatus(s) {
  const panel = document.getElementById('panel-status');
  let html = '<h2>Framework Status</h2><div class="status-grid">';
  html += `<div class="status-card"><h3>Symphony</h3><div class="value" style="color:${s.framework.enabled ? 'var(--success)' : 'var(--danger)'}">${s.framework.enabled ? 'Enabled' : 'Disabled'}</div><button class="toggle-btn" onclick="toggleSymphony()">${s.framework.enabled ? 'Disable' : 'Enable'} Symphony</button></div>`;
  html += `<div class="status-card"><h3>Version</h3><div class="value">${s.framework.version}</div></div>`;
  html += `<div class="status-card"><h3>Trello Integration</h3><div class="value" style="color:${s.trello.configured ? 'var(--success)' : 'var(--text-muted)'}">${s.trello.configured ? 'Connected' : s.trello.enabled ? 'Enabled (not configured)' : 'Disabled'}</div></div>`;
  html += `<div class="status-card"><h3>Active Workflow</h3><div class="value">${s.memory.activeWorkflow ? 'Yes' : 'None'}</div></div>`;
  html += '<div class="status-card" style="grid-column: span 2"><h3>Modules</h3>';
  for (const [name, info] of Object.entries(s.framework.modules)) {
    html += `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px"><span>${name}</span><span style="color:var(--text-muted)">${info.version || '—'}</span></div>`;
  }
  html += '</div></div>';
  panel.innerHTML = html;
}

function renderFooter(s) {
  document.getElementById('last-updated').textContent = `Last updated: ${new Date(s.timestamp).toLocaleTimeString()}`;
  const trelloEl = document.getElementById('trello-sync-status');
  if (s.trello.configured) { trelloEl.textContent = 'Trello: Connected'; trelloEl.style.color = 'var(--success)'; }
  else if (s.trello.enabled) { trelloEl.textContent = 'Trello: Not configured'; trelloEl.style.color = 'var(--warning)'; }
  else { trelloEl.textContent = 'Trello: Disabled'; trelloEl.style.color = 'var(--text-muted)'; }
}

async function toggleSymphony() {
  await fetch('/api/toggle', { method: 'POST' });
}

fetch('/api/state').then(r => r.json()).then(s => { state = s; render(s); });
