# Symphony — Hub UI, Trello Integration & Kill Switch Design Spec

> **Spec:** Hub + Trello + Toggle (3 features)
> **Status:** Draft — awaiting user review
> **Date:** 2026-04-10
> **Scope:** Defines the architecture, data model, file layout, configuration, and integration points for three new Symphony features: (1) a browser + terminal Hub dashboard, (2) Trello integration via MCP for sprint-focused visual task management, and (3) a global kill switch to disable/enable Symphony in Claude Code and Copilot. Does NOT define the internal implementation of the Hub's frontend components or Trello card templates — those are implementation details for the plan.

---

## 1. Design Principles

These three features form a **unified observability and control layer** for Symphony. They share state, respect the existing architecture, and degrade cleanly when disabled.

1. **Hub is read-mostly.** It reads existing Symphony state files (YAML, XML, Markdown). It does not create a parallel data store. The source of truth remains the files in `_symphony/` and `docs/`.
2. **Trello sync is MCP-native.** No custom HTTP clients or API wrappers. Symphony instructs the AI tool to call Trello MCP server tools. The AI tool handles authentication and transport.
3. **Kill switch is total.** When disabled, Symphony is invisible to the AI tool — no commands, no instructions, no background processes. One command to flip, one command to restore.
4. **All three respect the dual-layer architecture (spec §2.1).** Hub and Trello live in Core (`_symphony/`). Adapters are not touched. No business logic in adapters.
5. **All three respect the hook mechanism (spec §2.9).** Trello push uses the existing post-step hook. Hub updates via file-watching, not by intercepting engine internals.

---

## 2. Feature 1: Hub Dashboard

### 2.1 Overview

The Hub has two faces:

- **Browser dashboard** — a localhost web app launched via `/symphony-hub`. Rich panels for lifecycle progress, sprint status, context budget, command reference, memory state, and framework status.
- **Terminal summary** — a quick `/symphony-status` command that prints a single-screen overview without starting a server.

### 2.2 File Structure

```
_symphony/hub/
├── server.js             # Lightweight HTTP server (Hono, ~200 lines)
├── hub.yaml              # Hub configuration (port, refresh interval, theme)
├── state-reader.js       # Reads all Symphony state into a unified JSON object
├── public/
│   ├── index.html        # Single-page app shell
│   ├── styles.css        # Dashboard styles
│   └── app.js            # Client-side rendering + auto-refresh via SSE
└── views/
    ├── lifecycle.html    # Phase progress panel
    ├── sprint.html       # Active stories panel
    ├── context.html      # Token budget panel
    ├── commands.html     # Command reference with helper tips
    └── memory.html       # Sidecar & routing history panel
```

### 2.3 How the Browser Dashboard Works

1. `/symphony-hub` command starts the server on `localhost:3100` (configurable via `hub.port` in `global.yaml`) and opens the default browser.
2. `state-reader.js` scans these sources on each request:
   - `_symphony/_config/global.yaml` + `manifest.yaml` — framework state and version info
   - `_symphony/_config/lifecycle-sequence.yaml` — workflow map and next-step data
   - `_symphony/_memory/conductor-sidecar/routing-log.yaml` — routing history
   - `_symphony/_memory/checkpoints/` — active workflow progress
   - `docs/planning-artifacts/` + `docs/implementation-artifacts/` — artifact existence for phase detection
   - `_symphony/_memory/*-sidecar/` — agent memory state
3. Server pushes updates to the browser via **Server-Sent Events (SSE)**, triggered by `fs.watch` on `_symphony/` and `docs/`. No polling from the browser.
4. Server shuts down when the terminal session ends or when Symphony is disabled via the kill switch.

### 2.4 Dashboard Panels

| Panel | What It Shows | Data Source |
|---|---|---|
| **Lifecycle Progress** | 5-phase visual tracker. Current phase highlighted. Completed workflows checked off. Next recommended workflow highlighted. | `lifecycle-sequence.yaml` + artifact existence in `docs/` |
| **Sprint Board** | Active stories with status badges (backlog / in-progress / in-review / done). Trello sync indicator per story. | `docs/implementation-artifacts/sprint-status.md` + story files |
| **Context Budget** | Per-agent token usage bars showing used vs. 40K limit. Warnings when approaching budget. | Agent activation logs in memory sidecars |
| **Command Guide** | All `/symphony-*` commands grouped by lifecycle phase. Helper tips explaining when to use each. "Run next" highlight based on conductor's last routing. | `lifecycle-sequence.yaml` + conductor routing log |
| **Memory Inspector** | Browse agent sidecars. View conductor routing history. Staleness indicators from memory-hygiene protocol. | `_symphony/_memory/` directory tree |
| **Framework Status** | Symphony enabled/disabled toggle. Module versions from manifest. Adapter status. Trello sync health. Hub server uptime. | `global.yaml` + `manifest.yaml` |

### 2.5 Terminal Summary (`/symphony-status`)

A single-screen terminal output. No server required — reads files directly and prints formatted text.

Contents:
- **Line 1:** Current lifecycle phase + next recommended command (from conductor's last routing)
- **Line 2:** Sprint snapshot — X stories done / Y total, current story name + status
- **Line 3:** Trello sync — last sync time, sync health (ok/warning/error), pending conflicts
- **Line 4:** Framework — Symphony enabled/disabled, core version
- **Lines 5–7:** Last 3 conductor routing decisions (timestamp, goal, routed-to, confidence)

### 2.6 Hub Configuration

Added to `global.yaml`:

```yaml
hub:
  port: 3100
  auto_refresh: true
  refresh_interval_ms: 2000
```

---

## 3. Feature 2: Trello Integration via MCP

### 3.1 Overview

Sprint-focused Trello integration using a Trello MCP server. Two-way sync: Symphony pushes story status changes to Trello cards, and pulls card position changes back into Symphony story files.

The AI tool (Claude Code or Copilot) calls Trello MCP tools directly. Symphony provides the instructions and mapping — no custom API client code.

### 3.2 Why MCP

- **No custom HTTP code.** The MCP server handles all Trello API communication.
- **Works in both tools.** The same `.mcp.json` config works for Claude Code and GitHub Copilot.
- **Native to the AI tool.** MCP is a first-class integration mechanism. The AI tool already knows how to call MCP tools.
- **Credential management handled externally.** API keys live in environment variables, referenced by the MCP config. Symphony never touches them.

### 3.3 MCP Server

**Recommended:** SemblanceLabs `trello-mcp-server` (35 tools, most complete coverage of Trello API).

**Alternative:** `@delorenj/mcp-server-trello` (10 tools, simpler, easier setup).

The spec does not hard-depend on either — any Trello MCP server that exposes the required tools (see §3.7) is compatible.

### 3.4 MCP Configuration

A `.mcp.json` file at the project root (works for both Claude Code and Copilot):

```json
{
  "mcpServers": {
    "trello": {
      "command": "npx",
      "args": ["-y", "mcp-server-trello"],
      "env": {
        "TRELLO_API_KEY": "${TRELLO_API_KEY}",
        "TRELLO_TOKEN": "${TRELLO_TOKEN}"
      }
    }
  }
}
```

API credentials come from environment variables. Never hardcoded in config files.

### 3.5 File Structure

```
_symphony/integrations/trello/
├── integration.yaml          # Hook registration + board config reference
├── mapper.yaml               # Symphony story status <-> Trello column mapping
├── instructions.xml          # Instructions for the Conductor on when/how to call MCP tools
└── templates/
    └── card-description.md.tmpl   # Template for Trello card body content
```

No `.js` files. The sync engine is the AI tool itself, following instructions in `instructions.xml`.

### 3.6 Configuration in `global.yaml`

```yaml
integrations:
  trello:
    enabled: true
    board_id: "your-board-id"
    columns:
      backlog: "Backlog"
      in_progress: "In Progress"
      in_review: "In Review"
      done: "Done"
    card_template: "symphony-story"
```

Column names are configurable so the integration works with any existing Trello board layout.

### 3.7 Data Mapping

| Symphony Concept | Trello Concept |
|---|---|
| Story file (`docs/implementation-artifacts/stories/STORY-001.md`) | Card |
| Story status (backlog / in-progress / in-review / done) | Column (list) position |
| Story title | Card title |
| Story acceptance criteria | Card checklist |
| Story `traces_to` field (epic / requirement ID) | Card label |
| Review gate results (pass/fail per gate) | Card checklist named "Review Gates" |
| Sprint name | Card label or board filter |

Each card gets a `symphony-id: STORY-001` in its description header so the mapper can match cards to stories bidirectionally.

### 3.8 Symphony → Trello Push

Uses the existing artifact-enrichment-hook mechanism (architecture spec §2.9):

1. The `status-sync` protocol updates a story's status.
2. The post-step hook fires and reads `_symphony/integrations/trello/integration.yaml`.
3. The hook injects an instruction to the AI tool to call the appropriate Trello MCP tool.
4. The AI tool executes the MCP call.

| Story Event | MCP Tool Called |
|---|---|
| New story created | `createCard` — in the column matching the story's initial status |
| Status changed | `moveCard` — to the column matching the new status |
| Content updated | `updateCard` — refresh card description from template |
| Story deleted/archived | `archiveCard` — archive, not delete (safer) |
| Review gate completed | `createChecklistOnCard` / `updateCheckItem` — update gate checklist |
| Review passed | `addComment` — post summary comment |
| Epic/label assigned | `addLabelToCard` — tag with epic label |

Hook failures are non-blocking per architecture spec §2.9. If Trello is unreachable, a warning is logged and Symphony continues normally.

### 3.9 Trello → Symphony Pull

Triggered by the `/symphony-trello-sync` command:

1. The Conductor receives the sync command.
2. Instructions tell the AI tool to call `getBoardCards` and `getListCards` via MCP.
3. The AI tool reads the full board state from Trello.
4. For each card with a `symphony-id` in its description:
   - Look up the corresponding story file.
   - Compare the card's current column against the story's status.
   - If they differ: update the story file's status field.
   - Run `status-sync` protocol to propagate the change through Symphony.
5. Report results: X stories synced, Y conflicts found, Z new cards without Symphony IDs (ignored).

**Conflict resolution:** Last-write-wins with warning. If both Symphony and Trello changed the same story since last sync, the Trello change wins (user's manual action takes priority). A warning is logged to the Hub dashboard's Trello Sync Status panel.

### 3.10 Commands

| Command | Purpose |
|---|---|
| `/symphony-trello-sync` | Manual full bidirectional sync |
| `/symphony-trello-setup` | Guided setup: installs MCP server, helps configure board ID and column mapping |

---

## 4. Feature 3: Global Kill Switch

### 4.1 Overview

A single flag in `global.yaml` that disables all of Symphony. When off, the AI tool behaves as if Symphony is not installed — no commands visible, no instructions injected, no background processes.

### 4.2 The Flag

```yaml
symphony:
  enabled: true    # false = Symphony fully disabled
```

### 4.3 Toggle Command (`/symphony-toggle`)

**Disabling (`true` → `false`):**

1. Set `symphony.enabled: false` in `global.yaml`.
2. Back up and remove generated command files:
   - `.claude/commands/symphony*.md` → `_symphony/.disabled-cache/claude-code/`
   - `.github/prompts/symphony*.prompt.md` → `_symphony/.disabled-cache/copilot/`
3. Back up and strip Symphony sections from instruction files:
   - `CLAUDE.md` → `_symphony/.disabled-cache/CLAUDE.md.bak`
   - `.github/copilot-instructions.md` → `_symphony/.disabled-cache/copilot-instructions.md.bak`
4. Stop the Hub server if running.
5. Print: "Symphony disabled. Your AI tools will use their native behavior. Run `/symphony-toggle` to re-enable."

**Enabling (`false` → `true`):**

1. Set `symphony.enabled: true` in `global.yaml`.
2. Restore command files from `_symphony/.disabled-cache/`.
3. Restore `CLAUDE.md` and `copilot-instructions.md` from backups.
4. Remove `.disabled-cache/` directory.
5. Print: "Symphony re-enabled. All commands restored."

### 4.4 Backup Location

```
_symphony/
├── .disabled-cache/              # Only exists when Symphony is disabled
│   ├── claude-code/              # Backed-up Claude Code slash commands
│   ├── copilot/                  # Backed-up Copilot prompt files
│   ├── CLAUDE.md.bak             # Backed-up project instructions
│   └── copilot-instructions.md.bak
```

### 4.5 Guard Clause

Every Symphony entry point (Conductor step 1) checks the flag before executing:

```
IF global.yaml → symphony.enabled == false:
  PRINT "Symphony is currently disabled. Run /symphony-toggle to re-enable."
  EXIT
```

Belt-and-suspenders: even if a command file survives the disable step, the Conductor refuses to execute.

### 4.6 Edge Cases

- **Toggle while a workflow is in progress:** The toggle warns "A workflow is currently active (checkpoint exists). Disabling will pause it — you can resume when re-enabled." Checkpoints in `_symphony/_memory/checkpoints/` are preserved, not deleted.
- **The toggle command itself:** `/symphony-toggle` is the ONE command that is never removed during disable. It remains in `.claude/commands/` and `.github/prompts/` so the user can always re-enable.
- **Toggle while Hub is running:** Hub server receives a shutdown signal and stops gracefully. Browser shows "Symphony has been disabled" message.

---

## 5. Integration Points

### 5.1 How the Three Features Connect

```
┌─────────────────────────────────────────────────┐
│                  HUB DASHBOARD                   │
│                 (localhost:3100)                  │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │
│  │Lifecycle │ │ Sprint   │ │ Command Guide   │  │
│  │Progress  │ │ Board    │ │ + Helper Tips   │  │
│  └──────────┘ └────┬─────┘ └─────────────────┘  │
│                    │                             │
│  ┌──────────┐ ┌────┴─────┐ ┌─────────────────┐  │
│  │Context   │ │ Trello   │ │ Framework       │  │
│  │Budget    │ │ Sync     │ │ Status          │  │
│  │Monitor   │ │ Status   │ │ (on/off toggle) │  │
│  └──────────┘ └──────────┘ └────────┬────────┘  │
└─────────────────────────────────────┼────────────┘
                                      │
                              ┌───────▼────────┐
                              │  Kill Switch   │
                              │/symphony-toggle│
                              └───────┬────────┘
                                      │
                        ┌─────────────▼──────────────┐
                        │  When disabled:             │
                        │  • Hub server stops         │
                        │  • Trello hooks stop firing │
                        │  • All commands removed     │
                        │  • AI tools go native       │
                        └────────────────────────────┘
```

### 5.2 Specific Integration Points

1. **Hub shows Trello sync status.** The Sprint Board panel shows a Trello sync icon per story (synced / pending / conflict). A dedicated Trello Sync Status section shows last sync time, connection health, and pending conflicts.

2. **Kill switch controls everything.** When Symphony is disabled: Hub server shuts down, Trello hooks stop firing, all commands are removed. When re-enabled: everything restores.

3. **Hub shows toggle state.** The Framework Status panel displays whether Symphony is enabled/disabled prominently, with the toggle available from the dashboard UI.

4. **Terminal summary reflects all three.** `/symphony-status` shows one line per feature: current phase, Trello sync health, and enabled/disabled state.

### 5.3 New Commands Summary

| Command | Purpose | Requires Server |
|---|---|---|
| `/symphony-hub` | Launch browser dashboard | Starts server |
| `/symphony-status` | Terminal summary | No |
| `/symphony-trello-sync` | Manual full bidirectional Trello sync | No |
| `/symphony-trello-setup` | Guided Trello MCP configuration | No |
| `/symphony-toggle` | Enable/disable Symphony globally | No |

### 5.4 New `global.yaml` Additions

```yaml
symphony:
  enabled: true

hub:
  port: 3100
  auto_refresh: true
  refresh_interval_ms: 2000

integrations:
  trello:
    enabled: true
    board_id: ""
    columns:
      backlog: "Backlog"
      in_progress: "In Progress"
      in_review: "In Review"
      done: "Done"
    card_template: "symphony-story"
```

### 5.5 New Lifecycle Sequence Entries

Added to `_symphony/_config/lifecycle-sequence.yaml` under the `anytime` section:

```yaml
hub:
  phase: anytime
  command: /symphony-hub
  next:
    standalone: true

status:
  phase: anytime
  command: /symphony-status
  next:
    standalone: true

trello-sync:
  phase: anytime
  command: /symphony-trello-sync
  next:
    standalone: true

trello-setup:
  phase: anytime
  command: /symphony-trello-setup
  next:
    standalone: true

toggle:
  phase: anytime
  command: /symphony-toggle
  next:
    standalone: true
```

---

## 6. Constraints & Non-Goals

### Constraints

- Hub server must be lightweight. Use **Hono** (lightweight, zero-dependency HTTP framework). No Express — too heavy for a local dashboard.
- `state-reader.js` must complete a full state scan in < 500ms for responsive SSE updates.
- Trello MCP server is a runtime dependency only when Trello integration is enabled. Symphony works without it.
- The kill switch must be idempotent — running `/symphony-toggle` twice when already disabled does nothing harmful.
- All new files respect context budget discipline (spec §2.6): no `.md` file > 1000 lines, no `.js` file that would exceed 300 lines without splitting.

### Non-Goals

- **No Trello board creation.** The user creates the board in Trello. Symphony maps to it.
- **No real-time Trello webhooks.** Would require a public URL. Polling via `/symphony-trello-sync` is sufficient for a local dev tool.
- **No multi-user sync.** Symphony is a single-developer framework. Trello sync is one-user, one-board.
- **No custom Hub themes in v1.** One clean default theme. Theming can come later.
- **No mobile Hub.** Localhost only. Not exposed to the network.
