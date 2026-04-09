# ensemble-hello fixture checklist

## Pre-start gates
- [ ] Both participant persona files exist under tests/fixtures/agents/.
- [ ] workflow.yaml declares ensemble_participants and max_turns.

## Post-complete gates
- [ ] transcript.md was written.
- [ ] The transcript contains at least one contribution from each named participant.
- [ ] The loop terminated at or before max_turns.

## Stopping criterion
- Terminate after four total turns (two full round-robin rounds).
