# Business Insights FastMCP Server — Complete Spec

## 1. What this system does

Your business application exposes data through REST APIs (sales, inventory,
customers, finance, operations, etc.). This FastMCP server sits between those
APIs and Coiplot LLM. Coiplot calls tools on the MCP server; the server fetches
data from your REST APIs, formats it optimally for LLM reasoning, and returns it.
Coiplot then produces four classes of insight: trend analysis, anomaly detection,
summaries/reports, and forecasting/predictions.

---

## 2. Key design principle: generic tools, any domain

Because your business data spans many domains, the tool set is built around
**data shapes**, not domain names. The same three core tools work for sales,
inventory, finance, or any other domain you add later:

| Tool | Purpose | Insight types it feeds |
|---|---|---|
| `get_metric_timeseries` | Fetch a named metric over a time range | Trend, Anomaly, Forecasting |
| `get_kpi_snapshot` | Fetch a flat bundle of KPIs for a domain/period | Summaries |
| `compare_period_over_period` | Fetch the same metric for two periods side-by-side | Anomaly detection |
| `list_available_metrics` | Let Coiplot discover what metrics exist | All types |
| `get_dimension_breakdown` | Slice a metric by a dimension (region, product, etc.) | Summaries, Trend |

This means adding a new data domain (e.g. logistics) requires only adding its
REST endpoint to your config — no new tools needed.

---

## 3. Project layout

```
business_insights_mcp/
├── src/
│   ├── __init__.py
│   ├── server.py          # FastMCP init, lifespan, transport
│   ├── client.py          # Shared httpx session + per-API auth
│   ├── config.py          # Loads ENV vars, validates on startup
│   ├── errors.py          # HTTP status → actionable message
│   ├── models.py          # Shared Pydantic models + enums
│   └── tools/
│       ├── __init__.py
│       ├── timeseries.py  # get_metric_timeseries
│       ├── snapshot.py    # get_kpi_snapshot
│       ├── comparison.py  # compare_period_over_period
│       ├── discovery.py   # list_available_metrics
│       └── breakdown.py   # get_dimension_breakdown
├── tests/
│   └── test_tools.py
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
└── .env.example
```

---

## 4. Tool specifications

### 4.1 `get_metric_timeseries`

```
Purpose:  Fetch a single named metric as a time series.
          Feeds: trend analysis, anomaly detection, forecasting.

Input:
  metric_id   str   required   e.g. "revenue", "units_sold", "active_users"
  start_date  str   required   ISO date, e.g. "2024-01-01"
  end_date    str   required   ISO date, e.g. "2024-03-31"
  granularity str   optional   "day" | "week" | "month" (default: "day")
  domain      str   optional   hint to route to the right API endpoint

Output (JSON):
  {
    "metric_id": "revenue",
    "granularity": "day",
    "unit": "USD",
    "points": [
      {"date": "2024-01-01", "value": 42300.0},
      ...
    ],
    "summary": {
      "total": 1250000.0,
      "mean": 13736.0,
      "min": 8200.0,
      "max": 24100.0
    }
  }

Annotations:
  readOnlyHint: true
  destructiveHint: false
  idempotentHint: true
  openWorldHint: true
```

### 4.2 `get_kpi_snapshot`

```
Purpose:  Fetch a flat set of KPIs for a business domain and period.
          Feeds: summaries and reports.

Input:
  domain      str   required   e.g. "sales", "inventory", "finance"
  period      str   required   "today" | "this_week" | "this_month" |
                               "last_month" | "this_quarter" | "ytd"
  compare_to  str   optional   "previous_period" | "same_period_last_year"

Output (JSON):
  {
    "domain": "sales",
    "period": "this_month",
    "as_of": "2024-03-15T14:00:00Z",
    "kpis": {
      "total_revenue": {"value": 520000, "unit": "USD", "change_pct": 8.3},
      "orders_count": {"value": 1842, "unit": "orders", "change_pct": 5.1},
      "avg_order_value": {"value": 282.3, "unit": "USD", "change_pct": 3.0},
      "conversion_rate": {"value": 3.4, "unit": "%", "change_pct": -0.2}
    }
  }

Annotations:
  readOnlyHint: true
  destructiveHint: false
  idempotentHint: false   (value changes with time)
  openWorldHint: true
```

### 4.3 `compare_period_over_period`

```
Purpose:  Fetch a metric for two periods and compute the delta.
          Feeds: anomaly detection — Coiplot can spot unexpected swings.

Input:
  metric_id        str   required
  current_start    str   required   ISO date
  current_end      str   required   ISO date
  baseline_start   str   required   ISO date
  baseline_end     str   required   ISO date
  granularity      str   optional   default "day"

Output (JSON):
  {
    "metric_id": "revenue",
    "current":  {"total": 520000, "mean": 16774},
    "baseline": {"total": 480000, "mean": 15484},
    "delta": {
      "absolute": 40000,
      "percent": 8.33,
      "direction": "up"
    },
    "daily_deltas": [
      {"date": "2024-03-01", "current": 18200, "baseline": 15400, "pct_change": 18.2},
      ...
    ]
  }

Annotations:
  readOnlyHint: true
  destructiveHint: false
  idempotentHint: true
  openWorldHint: true
```

### 4.4 `list_available_metrics`

```
Purpose:  Let Coiplot discover what metrics exist before deciding
          which tool calls to make. Essential for open-ended questions.

Input:
  domain   str   optional   filter by domain

Output (JSON):
  {
    "metrics": [
      {
        "id": "revenue",
        "label": "Total revenue",
        "domain": "sales",
        "unit": "USD",
        "available_granularities": ["day", "week", "month"],
        "earliest_date": "2022-01-01"
      },
      ...
    ]
  }

Annotations:
  readOnlyHint: true
  destructiveHint: false
  idempotentHint: true
  openWorldHint: false
```

### 4.5 `get_dimension_breakdown`

```
Purpose:  Slice a metric by a categorical dimension.
          e.g. revenue by region, orders by product category.

Input:
  metric_id    str   required
  dimension    str   required   e.g. "region", "category", "channel"
  start_date   str   required
  end_date     str   required
  top_n        int   optional   default 10 — return top N values only

Output (JSON):
  {
    "metric_id": "revenue",
    "dimension": "region",
    "period": {"start": "2024-01-01", "end": "2024-03-31"},
    "total": 1250000,
    "breakdown": [
      {"value": "North America", "amount": 620000, "share_pct": 49.6},
      {"value": "Europe",        "amount": 390000, "share_pct": 31.2},
      ...
    ]
  }

Annotations:
  readOnlyHint: true
  destructiveHint: false
  idempotentHint: true
  openWorldHint: true
```

---

## 5. How Coiplot uses these tools per insight type

### Trend analysis
Coiplot calls `list_available_metrics` to understand what exists, then calls
`get_metric_timeseries` with a meaningful window (e.g. 90 days, daily). It
receives an array of data points and reasons over the shape of the curve —
growth rate, acceleration, seasonality, plateaus.

### Anomaly detection
Coiplot calls `compare_period_over_period` to get current vs baseline deltas.
For each metric in `daily_deltas`, it looks for values where `pct_change`
exceeds a normal range. It can also call `get_dimension_breakdown` to see if
the anomaly is concentrated in one region or category.

### Summaries and reports
Coiplot calls `get_kpi_snapshot` for each relevant domain (sales, inventory,
finance) in a single conversation turn. It receives flat KPI bundles with
`change_pct` values baked in — all the numbers it needs to write a concise
executive summary without doing arithmetic itself.

### Forecasting
Coiplot calls `get_metric_timeseries` with a long historical window (e.g. 12–24
months, weekly or monthly granularity). It receives the full history and uses
pattern recognition to project forward — seasonality, trend slope, cyclical
patterns. The longer the history, the better the projection.

---

## 6. `server.py`

```python
from contextlib import asynccontextmanager
from mcp.server.fastmcp import FastMCP
from .client import build_client
from .config import Settings
from .tools import timeseries, snapshot, comparison, discovery, breakdown

settings = Settings()

@asynccontextmanager
async def lifespan(app):
    client = build_client(settings)
    yield {"client": client, "settings": settings}
    await client.aclose()

mcp = FastMCP("business_insights_mcp", lifespan=lifespan)

timeseries.register(mcp)
snapshot.register(mcp)
comparison.register(mcp)
discovery.register(mcp)
breakdown.register(mcp)

if __name__ == "__main__":
    mcp.run(transport="streamable_http", port=settings.port)
```

---

## 7. `config.py` — ENV-driven, validated at startup

```python
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl

class Settings(BaseSettings):
    # Each REST API your business app exposes
    sales_api_url: AnyHttpUrl
    sales_api_token: str

    inventory_api_url: AnyHttpUrl
    inventory_api_token: str

    finance_api_url: AnyHttpUrl
    finance_api_token: str

    customers_api_url: AnyHttpUrl
    customers_api_token: str

    # Add more domains here as needed

    port: int = 8000
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
```

If a required variable is missing, the server refuses to start — no silent failures.

---

## 8. Response format strategy for Coiplot

All tools return **JSON strings** (not markdown). Reasons:

1. Coiplot can parse structured data and reason over numbers reliably.
2. Trend and anomaly reasoning works better on arrays than on pre-rendered text.
3. Coiplot writes the human-readable narrative itself — that's its job.

The one exception: `list_available_metrics` can return markdown for a quick
human-readable overview when called interactively.

---

## 9. Dockerfile

```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /build
COPY pyproject.toml .
RUN pip install --no-cache-dir --prefix=/install .

FROM python:3.12-slim AS runtime
WORKDIR /app
COPY --from=builder /install /usr/local
COPY src/ src/
RUN adduser --disabled-password --gecos "" mcpuser
USER mcpuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s \
  CMD python -c "import httpx; httpx.get('http://localhost:8000/health').raise_for_status()"
ENTRYPOINT ["python", "-m", "src.server"]
```

---

## 10. `.env.example`

```
SALES_API_URL=https://your-app.internal/api/sales
SALES_API_TOKEN=

INVENTORY_API_URL=https://your-app.internal/api/inventory
INVENTORY_API_TOKEN=

FINANCE_API_URL=https://your-app.internal/api/finance
FINANCE_API_TOKEN=

CUSTOMERS_API_URL=https://your-app.internal/api/customers
CUSTOMERS_API_TOKEN=

PORT=8000
LOG_LEVEL=INFO
```

---

## 11. `pyproject.toml`

```toml
[project]
name = "business-insights-mcp"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "mcp[server]>=1.8",
    "httpx>=0.27",
    "pydantic>=2.7",
    "pydantic-settings>=2.3",
]
```

---

## 12. Implementation order

| Phase | Deliverable | Done when |
|---|---|---|
| 1 | Scaffold + Dockerfile + docker-compose + config.py | Container starts, config validates |
| 2 | client.py + errors.py + models.py | Shared infra importable |
| 3 | discovery.py (`list_available_metrics`) | Coiplot can explore what exists |
| 4 | timeseries.py (`get_metric_timeseries`) | Trend + forecasting inputs work |
| 5 | snapshot.py (`get_kpi_snapshot`) | Summaries work |
| 6 | comparison.py (`compare_period_over_period`) | Anomaly detection works |
| 7 | breakdown.py (`get_dimension_breakdown`) | Dimensional slicing works |
| 8 | Wire to real API endpoints, test with MCP inspector | All tools return real data |
| 9 | Connect Coiplot, test all four insight types end to end | Full system working |

---

## 13. Before writing code — what you need to confirm

1. What are the actual base URLs of your business REST APIs?
2. What auth scheme do they use? (Bearer token / API key header / Basic auth)
3. What does a typical response look like for a sales or revenue endpoint?
   (Share one example JSON response and the tool specs can be made exact.)
4. Does your app already have a metrics/timeseries endpoint, or does the MCP
   server need to aggregate raw records into time series itself?
5. What is Coiplot's MCP connection URL format? (HTTP endpoint or stdio?)
