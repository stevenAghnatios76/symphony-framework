# Checkpoint File Schema

Checkpoints are written by the checkpoint-resume protocol after every completed step.

**Location:** `_symphony/_memory/checkpoints/{run-id}.yaml`

## Required Fields

| Field | Type | Description |
|---|---|---|
| `workflow_id` | string | The workflow's id from workflow.yaml |
| `run_id` | string | Unique run identifier (e.g., `run-2026-04-10-001`) |
| `execution_mode` | enum | `sequential`, `ensemble`, or `parallel-waves` |
| `interaction_mode` | enum | `normal`, `YOLO`, or `planning` |
| `owner_agent` | string | Agent id from workflow.yaml owner field |
| `current_step_index` | integer | Last completed step number (0 = not started) |
| `status` | enum | `in_progress`, `complete`, `halted_gate_failure`, `halted_unresolved_variable`, `halted_missing_file`, `halted_retry_exhausted`, `halted_user_abort`, `faulted` |
| `started_at` | ISO 8601 | When the workflow run began |
| `updated_at` | ISO 8601 | When the checkpoint was last written |
| `files_touched` | array | List of `{path, sha256, step, action}` entries |

## Optional Fields

| Field | Type | Description |
|---|---|---|
| `halt_reason` | string | Populated when status is `halted_*` |
| `ensemble_turn_pointer` | object | Only for ensemble mode: `{participant_id, turn_count}` |
