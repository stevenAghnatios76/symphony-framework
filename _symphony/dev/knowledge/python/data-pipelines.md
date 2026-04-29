# Python — Data Pipelines

**Principle:** Build idempotent, observable pipelines with clear stage boundaries. Fail fast, recover gracefully, and always know where your data is.

## Pattern Examples

### 1. ETL with Stage Isolation
```python
from dataclasses import dataclass
from pathlib import Path
import pandas as pd

@dataclass
class PipelineContext:
    run_id: str
    input_path: Path
    staging_path: Path
    output_path: Path

def extract(ctx: PipelineContext) -> pd.DataFrame:
    df = pd.read_csv(ctx.input_path)
    df.to_parquet(ctx.staging_path / f"{ctx.run_id}_raw.parquet")
    return df

def transform(df: pd.DataFrame, ctx: PipelineContext) -> pd.DataFrame:
    df = df.dropna(subset=['email'])
    df['email'] = df['email'].str.lower().str.strip()
    df = df.drop_duplicates(subset=['email'])
    df.to_parquet(ctx.staging_path / f"{ctx.run_id}_clean.parquet")
    return df

def load(df: pd.DataFrame, ctx: PipelineContext) -> int:
    df.to_parquet(ctx.output_path / f"{ctx.run_id}_final.parquet")
    return len(df)
```

### 2. Async Batch Processing
```python
import asyncio
from collections.abc import AsyncIterator

async def process_batch(items: list[dict], batch_size: int = 100) -> AsyncIterator[dict]:
    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        results = await asyncio.gather(
            *(process_item(item) for item in batch),
            return_exceptions=True,
        )
        for item, result in zip(batch, results):
            if isinstance(result, Exception):
                yield {"item": item, "status": "error", "error": str(result)}
            else:
                yield {"item": item, "status": "success", "result": result}
```

### 3. Idempotent Processing with Checkpoints
```python
import json
from pathlib import Path

class CheckpointManager:
    def __init__(self, checkpoint_path: Path):
        self.path = checkpoint_path
        self.processed: set[str] = set()
        if self.path.exists():
            self.processed = set(json.loads(self.path.read_text()))

    def is_processed(self, item_id: str) -> bool:
        return item_id in self.processed

    def mark_processed(self, item_id: str) -> None:
        self.processed.add(item_id)
        self.path.write_text(json.dumps(sorted(self.processed)))
```

## Anti-Patterns
- **No idempotency** — rerunning a pipeline should produce the same result, not duplicates
- **Silent data loss** — log and count dropped/failed records, alert on thresholds
- **Unbounded memory** — use chunked reading (`pd.read_csv(chunksize=)`) for large files
- **No staging area** — always write intermediate results so you can inspect and restart from any stage

## Integration Points
- **Orchestration:** Prefect, Airflow, or Dagster for scheduling and dependency management
- **Storage:** Parquet for columnar analytics, JSON Lines for streaming, Delta Lake for ACID
- **Monitoring:** Structured logging with record counts per stage, alerting on anomalies
