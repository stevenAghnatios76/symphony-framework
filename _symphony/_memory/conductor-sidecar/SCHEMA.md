# Conductor Sidecar Schema

The Conductor's privileged memory sidecar stores routing decisions.

**Location:** `_symphony/_memory/conductor-sidecar/routing-log.yaml`

## routing-log.yaml Format

```yaml
routing_history:
  - timestamp: "ISO 8601"
    user_goal: "<natural language goal from user>"
    parsed_intent:
      verb: "<intent verb>"
      noun: "<target noun>"
      scope: "<scope hint or null>"
    detected_phase: "<phase id>"
    selected_workflow: "<workflow id>"
    confidence: 0.92
    confidence_breakdown:
      intent_match: 0.38
      project_state_clarity: 0.27
      prior_routing_memory: 0.27
    auto_dispatched: true
    user_correction: null
```

## Fields

| Field | Type | Description |
|---|---|---|
| `routing_history` | array | Append-only log of routing decisions |
| `timestamp` | ISO 8601 | When the routing decision was made |
| `user_goal` | string | Raw natural language from the user |
| `parsed_intent` | object | Conductor's parse: verb, noun, scope |
| `detected_phase` | string | Phase the Conductor determined |
| `selected_workflow` | string | Workflow id chosen |
| `confidence` | float | Overall confidence score (0.0-1.0) |
| `confidence_breakdown` | object | 3-component score breakdown |
| `auto_dispatched` | boolean | Whether confidence >= 0.80 threshold |
| `user_correction` | string/null | If user overrode, what they chose instead |
