# API Documentation

The **AWS Usage & Report Analysis Platform** backend exposes RESTful endpoints with full OpenAPI documentation at `/docs` and `/redoc`.

Base URL: `http://localhost:8000/api`

---

## 1. Health & Status Endpoints

### `GET /api/health`
Returns the status, runtime uptime, and cache statistics of the backend engine.

**Sample Response:**
```json
{
  "status": "HEALTHY",
  "service": "AWS Usage & Report Analysis API",
  "version": "1.0.0",
  "data_source": "mock",
  "uptime_seconds": 124.5,
  "environment": "development",
  "cache": {
    "cached_entries": 3,
    "hits": 14,
    "misses": 3,
    "hit_rate_pct": 82.4
  }
}
```

### `GET /api/aws-status`
Returns real-time diagnostics of the S3 bucket, Athena query engine, and cache hit metrics.

---

## 2. Analytics & Dashboard Endpoints

### `GET /api/dashboard`
Returns high-level summary KPIs, historical monthly spend, service/regional distributions, daily spend timeline, recent usage events, and dynamic rule-based optimization insights.

**Query Parameters:**
* `start_date` *(optional, string)*: Filter starting date (`YYYY-MM-DD`).
* `end_date` *(optional, string)*: Filter ending date (`YYYY-MM-DD`).
* `service` *(optional, array/repeat)*: Filter by AWS service name(s).
* `region` *(optional, array/repeat)*: Filter by AWS region code(s).
* `environment` *(optional, array/repeat)*: Filter by environment tag (e.g. `Production`).
* `use_cache` *(optional, boolean, default: true)*: Enable or bypass TTL cache.

### `GET /api/costs`
Returns deep-dive financial metrics:
* Service-wise spend with percentage contribution
* Regional cost distribution
* Environment breakdown (Production vs Staging vs Dev)
* Pareto 80/20 cumulative cost curve
* Top 20 highest-cost AWS resource identifiers

### `GET /api/usage`
Returns operational capacity telemetry:
* Total workload volume units by service
* Granular usage meters with effective per-unit pricing rates
* Monthly consumption trends
* Top resource consumers

### `GET /api/services`
Returns a catalog of active AWS services with categories, total spend, usage units, primary regions, and MoM change %.

### `GET /api/regions`
Returns regional spend aggregates and active service counts.

---

## 3. Report Generation & Exports

### `POST /api/reports/generate`
Generates a structured report model with live summary metrics and download links.

**Request Body:**
```json
{
  "report_title": "Q3 Cloud Expenditure & Optimization Audit",
  "start_date": "2026-07-01",
  "end_date": "2026-10-01",
  "services": ["Amazon EC2", "Amazon S3", "Amazon RDS"],
  "regions": ["us-east-1", "eu-west-1"],
  "include_recommendations": true
}
```

### `GET /api/reports/download/pdf`
Generates and streams a high-resolution, branded PDF report document using ReportLab.

### `GET /api/reports/download/csv`
Generates and streams an RFC-4180 compliant CSV spreadsheet file.

---

## 4. Cache & Engine Configuration

### `POST /api/aws-status/cache/clear`
Flushes all cached query results and resets hit/miss counters.

### `POST /api/aws-status/mode`
Switches operational data engine mode (`mock` vs `aws`).
