# AWS Usage & Report Analysis Platform

> **A Full-Stack Cloud Financial Management (FinOps) & Telemetry Platform powered by React, FastAPI, Amazon Athena, and Amazon S3.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![AWS Athena](https://img.shields.io/badge/Amazon_Athena-SQL-FF9900.svg?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/athena/)
[![Amazon S3](https://img.shields.io/badge/Amazon_S3-Storage-569A31.svg?logo=amazon-s3&logoColor=white)](https://aws.amazon.com/s3/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 1. Project Title

**AWS Usage & Report Analysis Platform** (Cloud FinOps & Infrastructure Telemetry Engine)

---

## 2. Project Description

The **AWS Usage & Report Analysis Platform** is an enterprise-grade cloud analytics web application designed to collect, ingest, store, and analyze AWS billing and resource consumption data. 

By leveraging **Amazon S3** for secure data lake storage and **Amazon Athena** for serverless distributed SQL queries, the system extracts critical financial insights through a high-performance **FastAPI** backend and visualizes real-time KPIs, Pareto 80/20 spend distributions, and automated cost optimization recommendations on a modern **React (Vite + Tailwind CSS)** dashboard.

---

## 3. Problem Statement

As cloud footprints expand, organizations struggle with:
1. **Unpredictable AWS Bills**: Complex multi-service usage makes identifying cost drivers challenging.
2. **Slow Manual Audits**: Standard AWS Cost Explorer lacks consolidated, customizable PDF/CSV reporting.
3. **High Athena Query Latencies/Costs**: Repeated full-dataset scans waste money and slow dashboards.
4. **Lack of Actionable Insights**: Raw metrics do not provide immediate, rule-based optimization guidance (e.g. idle dev instances, missing S3 lifecycle policies, uncommitted savings plans).

---

## 4. Objectives

* **Automate Cloud FinOps**: Deliver instant visibility into AWS expenditures across services, regions, and environments.
* **Serverless Query Orchestration**: Execute optimized Athena SQL queries with Boto3 and parse results asynchronously.
* **Cost Efficiency & Caching**: Minimize Athena data scan fees with an intelligent in-memory TTL query caching layer.
* **Dynamic Optimization Insights**: Automatically detect month-over-month spend surges, regional concentrations, and resource right-sizing opportunities.
* **Executive PDF & CSV Export**: Generate branded, audit-ready financial reports with one click.
* **Dual-Engine Operation**: Seamlessly operate in **Mock Development Mode** (zero AWS cost) or **Live AWS Mode** (S3 + Athena).

---

## 5. Key Features

* **Executive Dashboard**: 6 core KPIs (Total Cost, Monthly Spend, Total Usage, Active Services, Top Cost Driver, MoM Change %) and 5 Recharts visualizations.
* **Cost Analysis & Pareto 80/20**: Cumulative spend curve, environment share (Production vs Staging vs Development), and top 20 expensive resource explorer.
* **Workload & Meter Usage**: Granular usage meter breakdown with effective per-unit pricing rates and regional workload distribution.
* **AWS Services Directory**: Sortable, searchable catalog of all active AWS products with primary regions and detail modal.
* **Automated Optimization Actions**: Rule-based dynamic recommendations (Compute Savings Plans, S3 Intelligent-Tiering, Non-Production Instance Scheduling).
* **Report Builder & Downloads**: Interactive custom report generator with direct PDF (ReportLab) and CSV downloads.
* **Architecture & SQL Console**: Interactive pipeline flow diagram and built-in Athena SQL catalog runner.
* **Zero Credential Exposure**: Secure architecture keeping secret keys strictly within backend server memory.

---

## 6. Technology Stack

### Frontend
* **Core**: React 18, Vite 5, JavaScript (ES2022)
* **Styling**: Tailwind CSS (Custom AWS Cloud Console palette), Glassmorphism, CSS3 animations
* **Visualizations**: Recharts (Responsive Area, Bar, Donut, Line, and Pareto charts)
* **Routing**: React Router v6
* **Icons**: Lucide React
* **HTTP Client**: Axios with global timeout and error handling

### Backend
* **Framework**: FastAPI (Python 3.11+)
* **ASGI Server**: Uvicorn
* **Cloud SDK**: Boto3 (Amazon Athena, Amazon S3, AWS Glue)
* **Data Processing**: Pandas, NumPy
* **Data Validation**: Pydantic v2 & Pydantic-Settings
* **PDF Generation**: ReportLab (Vector graphics and styled tables)
* **Configuration**: Python-Dotenv

### Cloud Infrastructure
* **Amazon S3**: Raw CSV/Parquet billing data store and generated report archive
* **Amazon Athena**: Serverless Presto/Trino SQL query execution engine
* **AWS Glue Data Catalog**: Metadata catalog and schema definitions
* **AWS IAM**: Role-based access control and least-privilege security policies

---

## 7. Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                                  USER / BROWSER                               |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                       REACT FRONTEND (Vite + Tailwind CSS)                    |
|  - Modern AWS Dashboard (/dashboard)                                          |
|  - Cost & Pareto 80/20 Analysis (/cost-analysis)                              |
|  - Usage & Meter Consumption (/usage-analysis)                                |
|  - AWS Services Catalog (/services)                                           |
|  - Custom Report Generator (/reports)                                         |
|  - Athena Query Console (/aws-data)                                           |
|  - Settings & Mode Switcher (/settings)                                       |
+-------------------------------------------------------------------------------+
                                       |  REST API (JSON / Multipart / Binary)
                                       v
+-------------------------------------------------------------------------------+
|                      FASTAPI BACKEND SERVICE (Python)                         |
|  - In-Memory TTL Query Cache (300s)                                           |
|  - Rule-Based Automated Insights Engine                                        |
|  - Native ReportLab PDF & CSV Generator                                       |
|  - Dual Mode Engine: Live AWS (Boto3) <---> Mock Emulated Data Fallback       |
+-------------------------------------------------------------------------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
+------------------------------------+  +---------------------------------------+
|        BOTO3 ATHENA SERVICE        |  |            BOTO3 S3 SERVICE           |
|  - StartQueryExecution             |  |  - Raw CSV / Parquet Data Lake        |
|  - Polling (SUCCEEDED/FAILED)      |  |  - Bucket Inspection & Health Checks  |
|  - Column/Row Conversion to Dicts  |  |  - PDF Report Storage                 |
+------------------------------------+  +---------------------------------------+
                   |                                       |
                   v                                       v
+-------------------------------------------------------------------------------+
|                        AMAZON ATHENA & S3 DATA LAKE                           |
|  - Database: `aws_usage_db`                                                   |
|  - External Table: `aws_usage_reports`                                         |
+-------------------------------------------------------------------------------+
```

---

## 8. Folder Structure

```text
aws-usage-report-analysis/
│
├── frontend/                          # React + Vite Frontend Application
│   ├── src/
│   │   ├── components/                # Reusable UI Components
│   │   │   ├── Sidebar.jsx            # AWS Console Navigation Sidebar
│   │   │   ├── Navbar.jsx             # Top bar with cache flusher & alerts
│   │   │   ├── StatCard.jsx           # Metric cards with MoM badges
│   │   │   ├── ChartCard.jsx          # Reusable chart container
│   │   │   ├── FilterBar.jsx          # Date horizon, Service & Region filters
│   │   │   ├── InsightsSection.jsx    # Actionable optimization recommendations
│   │   │   ├── LoadingSkeleton.jsx    # Smooth skeleton loaders
│   │   │   ├── ErrorAlert.jsx         # Error banners with retry action
│   │   │   ├── EmptyState.jsx         # Empty filter states
│   │   │   └── AwsStatusBadge.jsx     # Diagnostic connection badge
│   │   ├── pages/                     # Application Pages
│   │   │   ├── Dashboard.jsx          # Executive Overview (6 KPIs + 5 Charts)
│   │   │   ├── CostAnalysis.jsx       # Pareto 80/20 & Cost Allocations
│   │   │   ├── UsageAnalysis.jsx      # Workload Meters & Unit Rates
│   │   │   ├── Services.jsx           # AWS Services Directory & Modal
│   │   │   ├── Reports.jsx            # Custom Report Builder & PDF Export
│   │   │   ├── AwsData.jsx            # S3 / Athena Diagnostics & SQL Runner
│   │   │   └── Settings.jsx           # Engine Mode Switcher & Cache Config
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx         # Layout wrapper
│   │   ├── services/
│   │   │   └── api.js                 # Axios API Service Layer
│   │   ├── utils/
│   │   │   └── formatters.js          # Currency, numbers, and color helpers
│   │   ├── App.jsx                    # React Router configuration
│   │   ├── main.jsx                   # Entry DOM renderer
│   │   └── index.css                  # Tailwind styles and tokens
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── backend/                           # FastAPI Backend Application
│   ├── app/
│   │   ├── main.py                    # FastAPI application entry point
│   │   ├── config.py                  # Pydantic environment configuration
│   │   ├── routes/                    # API Route Handlers
│   │   │   ├── health.py              # /api/health
│   │   │   ├── dashboard.py           # /api/dashboard
│   │   │   ├── costs.py               # /api/costs
│   │   │   ├── usage.py               # /api/usage
│   │   │   ├── services.py            # /api/services
│   │   │   ├── regions.py             # /api/regions
│   │   │   ├── reports.py             # /api/reports & download PDF/CSV
│   │   │   └── aws_status.py          # /api/aws-status & cache flusher
│   │   ├── services/                  # Business Logic & Cloud Services
│   │   │   ├── athena_service.py      # Boto3 Athena query lifecycle
│   │   │   ├── s3_service.py          # S3 bucket inspector & uploader
│   │   │   ├── mock_data_service.py   # Pandas-based query emulation
│   │   │   ├── insights_service.py    # Rule-based optimization generator
│   │   │   ├── report_service.py      # ReportLab PDF & CSV builder
│   │   │   └── cache_service.py       # Thread-safe in-memory TTL cache
│   │   ├── models/
│   │   │   └── schemas.py             # Pydantic request/response models
│   │   └── utils/
│   │       └── helpers.py             # Region & service category mappings
│   ├── requirements.txt
│   ├── .env.example
│   └── test_endpoints.py              # Automated backend test suite
│
├── sql/                               # Amazon Athena SQL Query Definitions
│   ├── database.sql                   # Athena database creation
│   ├── tables.sql                     # External CSV & Parquet table schemas
│   ├── dashboard_queries.sql          # High-level KPIs & MoM calculations
│   ├── cost_queries.sql               # Pareto, regional & daily spend queries
│   └── usage_queries.sql              # Meter volumes & resource consumer queries
│
├── data/
│   └── sample_aws_usage.csv           # 10,000+ realistic AWS records
│
├── docs/
│   ├── architecture.md                # System architecture documentation
│   ├── aws-setup.md                   # Step-by-step AWS deployment guide
│   └── api-documentation.md           # OpenAPI endpoint specification
│
├── .gitignore
├── README.md
└── docker-compose.yml
```

---

## 9. AWS Setup

Follow the detailed instructions in [docs/aws-setup.md](docs/aws-setup.md) to configure S3, Athena, and IAM.

---

## 10. Amazon S3 Configuration

1. Create a data bucket: `s3://your-aws-usage-bucket-name/`
2. Create an Athena results bucket: `s3://your-athena-query-results-bucket/`
3. Upload data files to `s3://your-aws-usage-bucket-name/raw-usage-data/`

---

## 11. Amazon Athena Configuration

Run the SQL scripts in `sql/` to create the database and table:

```sql
-- 1. Create Database
CREATE DATABASE IF NOT EXISTS aws_usage_db;

-- 2. Create Table
CREATE EXTERNAL TABLE IF NOT EXISTS aws_usage_db.aws_usage_reports (
    `date` STRING,
    `service` STRING,
    `region` STRING,
    `usage_type` STRING,
    `usage_quantity` DOUBLE,
    `usage_unit` STRING,
    `cost` DOUBLE,
    `currency` STRING,
    `resource_id` STRING,
    `account_id` STRING,
    `tag_environment` STRING,
    `tag_project` STRING
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
LOCATION 's3://your-aws-usage-bucket-name/raw-usage-data/'
TBLPROPERTIES ('skip.header.line.count'='1');
```

---

## 12. Environment Variables

Create `backend/.env` based on `backend/.env.example`:

```env
# Application Mode: 'mock' (Development) or 'aws' (Production Live)
DATA_SOURCE=mock

# Server Configuration
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# Cache Configuration
CACHE_TTL_SECONDS=300

# AWS Credentials (Required only when DATA_SOURCE=aws)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY

# Athena & S3
ATHENA_DATABASE=aws_usage_db
ATHENA_TABLE=aws_usage_reports
ATHENA_WORKGROUP=primary
ATHENA_OUTPUT_LOCATION=s3://your-athena-query-results-bucket/athena-results/
S3_BUCKET=your-aws-usage-bucket-name
S3_PREFIX=raw-usage-data/
```

---

## 13. Local Installation

Clone the repository:

```bash
git clone https://github.com/your-username/aws-usage-report-analysis.git
cd aws-usage-report-analysis
```

---

## 14. Running Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at **`http://localhost:5173`**.

---

## 15. Running Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The backend API will start at **`http://localhost:8000`**.

---

## 16. API Documentation

Once the backend is running, open:
* Interactive Swagger Docs: **`http://localhost:8000/docs`**
* ReDoc Alternative: **`http://localhost:8000/redoc`**

---

## 17. Production Deployment (Public HTTPS Cloud Hosting)

This project is fully architected for public cloud deployment using **AWS Amplify** for the React frontend and **AWS App Runner** for the FastAPI backend.

```
Public Internet (Any Laptop / Phone)
                ↓ HTTPS
AWS Amplify Hosting (React + Vite)
                ↓ REST API HTTPS
AWS App Runner (FastAPI + Uvicorn)
                ↓ IAM Instance Role
Amazon S3 + Amazon Athena (Data Lake & SQL)
```

### Complete Guide
👉 For step-by-step AWS console instructions, IAM role policies, and troubleshooting, read the **[Production Deployment Guide](docs/deployment.md)**.

### Quick Deployment Summary

#### 1. Backend on AWS App Runner
1. Connect your GitHub repository to **AWS App Runner**.
2. **Runtime**: Python 3.
3. **Build Command**: `pip install -r backend/requirements.txt`
4. **Start Command**: `python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000`
5. **Port**: `8000`
6. **Instance Role**: Attach IAM Role with S3, Athena, and Glue Read permissions (see [docs/deployment.md](docs/deployment.md)).
7. **Environment Variables**:
   - `DATA_SOURCE`: `aws` (or `mock` for zero-cost demo)
   - `AWS_REGION`: `ap-south-1` (or your region)
   - `S3_BUCKET_NAME`: `your-aws-usage-bucket`
   - `ATHENA_DATABASE`: `aws_usage_db`
   - `ATHENA_TABLE`: `aws_usage_reports`
   - `ATHENA_OUTPUT_LOCATION`: `s3://your-athena-query-results-bucket/athena-results/`
   - `CORS_ORIGINS`: `https://main.your-amplify-id.amplifyapp.com,http://localhost:5173`
8. Deploy to obtain your public API URL: `https://<id>.<region>.awsapprunner.com`.
9. Verify health check: `https://<id>.<region>.awsapprunner.com/api/health`.

#### 2. Frontend on AWS Amplify Hosting
1. Connect GitHub repository to **AWS Amplify**.
2. Amplify automatically uses [`amplify.yml`](amplify.yml) for Vite build (`npm install` -> `npm run build` -> `frontend/dist`).
3. Add Environment Variable:
   - `VITE_API_URL`: `https://<YOUR_APP_RUNNER_DOMAIN>.awsapprunner.com/api`
4. In **Rewrites and redirects**, ensure SPA redirect rule is active:
   `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>` -> `/index.html` (Status: 200 Rewrite).
5. Deploy to receive your live public URL: `https://main.<id>.amplifyapp.com`.

---

## 18. AWS Cost Safety & Student Budget Protection

* **Zero-Cost Mock Mode**: Keep `DATA_SOURCE=mock` to run full platform analytics without spending anything on AWS.
* **Athena Query Optimization**: Athena costs $5.00 per TB scanned. Queries use column pruning and date filters to scan tiny fractions of a megabyte (< $0.0001 per query).
* **Backend In-Memory Cache**: Built-in 300s TTL cache prevents repeat queries from hitting Athena.
* **App Runner Auto-Scaling**: Configured with 1 min instance and can be paused with one click when not demonstrating.
* **Amplify Free Tier**: Generous 1,000 build minutes and 15 GB served monthly.

---

## 19. Future Enhancements

* **Machine Learning Forecasting**: Integrate AWS Forecast or Prophet for 90-day spend predictions.
* **Slack / Email Anomaly Alerts**: Webhook alerts when daily spend exceeds a dynamic threshold.
* **Multi-Account AWS Organizations**: Ingest CUR across multiple linked AWS accounts.
* **Automated Remediation**: One-click lambda execution to stop idle development instances.

---

## 20. Author & License

* **Project**: AWS Usage & Report Analysis Platform
* **Purpose**: College Project & Placement Demonstration
* **License**: MIT License
