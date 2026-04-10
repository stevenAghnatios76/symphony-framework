# Agent Sidecar Schema

Each agent has a memory sidecar at `_symphony/_memory/{agent-id}-sidecar/`.

## decisions.yaml

Stores persistent decisions made by the agent across workflow runs.

### Format

```yaml
agent_id: <agent-id>
decisions:
  - id: d-001
    date: "YYYY-MM-DD"
    context: "<workflow and step where the decision was made>"
    decision: "<what was decided>"
    rationale: "<why this decision was made>"
    traces_to: "<path to the artifact this decision relates to>"
    reviewed_at: null
```

### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `agent_id` | string | yes | Matches the sidecar directory name |
| `decisions` | array | yes | List of decision entries |
| `decisions[].id` | string | yes | Unique within this sidecar |
| `decisions[].date` | date | yes | When the decision was made |
| `decisions[].context` | string | yes | Workflow + step context |
| `decisions[].decision` | string | yes | What was decided |
| `decisions[].rationale` | string | yes | Why |
| `decisions[].traces_to` | string | yes | Artifact path for memory-hygiene cross-reference |
| `decisions[].reviewed_at` | date | no | Set by memory-hygiene protocol |
