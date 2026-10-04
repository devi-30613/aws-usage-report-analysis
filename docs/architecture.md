# AWS Usage & Report Analysis Platform - Architecture Documentation

## 1. System Overview

The **AWS Usage & Report Analysis Platform** is a full-stack, cloud-native financial management (FinOps) and operational telemetry system. It processes AWS Cost and Usage Reports (CUR), enables interactive analytics, automates cost optimization insights, and generates executive PDF/CSV reports.

```
+-------------------------------------------------------------------------------+
|                                  USER / CLIENT                                |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                       REACT FRONTEND (Vite + Tailwind CSS)                    |
|  - Dashboard (KPIs, Spend Velocity, Recharts Visualizations)                  |
|  - Cost & Pareto 80/20 Analysis                                               |
|  - Workload & Meter Usage Analysis                                            |
|  - AWS Services Catalog & Modal Inspector                                     |
|  - Custom Report Builder & PDF/CSV Downloader                                 |
|  - Athena Query Console & S3 Diagnostics                                      |
+-------------------------------------------------------------------------------+
                                       |  HTTPS / REST API
                                       v
+-------------------------------------------------------------------------------+
|                      FASTAPI BACKEND SERVICE (Python 3)                       |
|  - Endpoints: /api/dashboard, /api/costs, /api/usage, /api/reports, /api/...  |
|  - Query In-Memory TTL Caching Engine                                         |
|  - Dynamic Rule-Based Cost Optimization Engine                                |
|  - ReportLab PDF Generation & CSV Streaming Engine                            |
|  - Dual Mode Engine: Live AWS (Boto3) <-> Mock Emulation Fallback             |
+-------------------------------------------------------------------------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
+------------------------------------+  +---------------------------------------+
|        BOTO3 ATHENA SERVICE        |  |            BOTO3 S3 SERVICE           |
|  - StartQueryExecution             |  |  - Raw CSV / Parquet CUR Store        |
|  - Polling & State Management      |  |  - Bucket Inspection & Health Checks  |
|  - Paginated Result Parsing        |  |  - Generated Report Archival          |
+------------------------------------+  +---------------------------------------+
                   |                                       |
                   v                                       v
+-------------------------------------------------------------------------------+
|                      AMAZON ATHENA & GLUE DATA CATALOG                        |
|  - Database: aws_usage_db                                                     |
|  - External Table: aws_usage_reports                                          |
|  - Optimized Columnar Partitioning                                            |
+-------------------------------------------------------------------------------+
```

---

## 2. Component Breakdown

### A. Frontend Layer (React + Vite + Tailwind CSS)
* **SPA Routing**: React Router v6 provides seamless page transitions across `/dashboard`, `/cost-analysis`, `/usage-analysis`, `/services`, `/reports`, `/aws-data`, and `/settings`.
* **Visual Theme**: AWS Cloud Console aesthetic with custom tokens (AWS Squid `#232F3E`, AWS Orange `#FF9900`, Deep Navy `#0F172A`, Sky Blue `#0073BB`), dark glassmorphism, responsive grids, and loading skeletons.
* **Charts & Analytics**: Recharts library delivers responsive interactive Area, Bar, Donut, Line, and Pareto charts.
* **Resilient API Client**: Axios instance with centralized query string serialization, timeout management, and error interceptors.

### B. Backend Layer (FastAPI + Pydantic + ReportLab)
* **High Performance**: Asynchronous ASGI server (Uvicorn + FastAPI) with type validation through Pydantic v2 schemas.
* **Caching Strategy**: Thread-safe in-memory TTL caching prevents redundant, expensive Athena scans for identical filter sets.
* **Report Generation**: Native Python `ReportLab` engine constructs branded, formatted PDF documents with key summary tables and rule-based insights.
* **Graceful Fallback / Dual Engine**: Seamlessly transitions between live Athena execution and local pandas mock data processing.

### C. AWS Cloud Data Layer
* **Amazon S3**: Stores raw billing and usage telemetry data partitioned by date, service, and region.
* **AWS Glue Data Catalog**: Manages the schema definitions and table metadata for `aws_usage_reports`.
* **Amazon Athena**: Executes serverless distributed SQL queries over the S3 data lake.
* **IAM**: Least-privilege IAM policies grant query execution and S3 bucket read/write permissions without exposing credentials to client browsers.

---

## 3. Data Flow Sequence

1. **User Interaction**: User filters data by date range (e.g. `2026-01-01` to `2026-10-01`) or AWS service on the React dashboard.
2. **API Request**: Axios sends `GET /api/dashboard?start_date=2026-01-01&end_date=2026-10-01` to FastAPI.
3. **Cache Lookup**: FastAPI checks the TTL cache for a matching hash.
   * If **Cache Hit**: Returns cached JSON in `< 5ms`.
   * If **Cache Miss**:
     * In **AWS Mode**: Boto3 submits query to Athena `start_query_execution()`, polls execution status, retrieves paginated rows, and formats into JSON.
     * In **Mock Mode**: Pandas queries `data/sample_aws_usage.csv` with equivalent SQL aggregations.
4. **Insight Generation**: The backend analyzes cost percentages and month-over-month trends, generating rule-based recommendations (Savings Plans, S3 Intelligent-Tiering, Dev instance schedules).
5. **Client Render**: React updates KPI cards, Recharts visualizations, and table views smoothly.
