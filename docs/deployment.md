# AWS Usage & Report Analysis Platform - Production Deployment Guide

This guide provides step-by-step instructions to deploy the **AWS Usage & Report Analysis Platform** as a live, public, enterprise-grade web application accessible worldwide via secure HTTPS.

```
                  +-----------------------------------+
                  |      PUBLIC INTERNET USERS        |
                  |   (Laptops, Desktops, Phones)     |
                  +-----------------------------------+
                                    |
                                    v [Public HTTPS]
                  +-----------------------------------+
                  |        AWS AMPLIFY HOSTING        |
                  |     (React + Vite Single Page App)|
                  +-----------------------------------+
                                    |
                                    v [Secure REST API / JSON]
                  +-----------------------------------+
                  |          AWS APP RUNNER           |
                  |       (FastAPI + Uvicorn API)     |
                  +-----------------------------------+
                                    |
                                    v [IAM Role / Least Privilege]
                  +-----------------------------------+
                  |      AMAZON ATHENA & AMAZON S3    |
                  |   (Distributed SQL & Data Lake)   |
                  +-----------------------------------+
```

---

## Architecture Overview

| Component | Technology | AWS Hosting Service | Public Endpoint Type |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts | **AWS Amplify Hosting** | `https://main.<id>.amplifyapp.com` |
| **Backend** | Python 3.11, FastAPI, Uvicorn, Boto3 | **AWS App Runner** | `https://<id>.<region>.awsapprunner.com` |
| **Data Lake** | Amazon S3 (Raw usage CSV, Reports) | **Amazon S3** | Private (Bucket IAM access) |
| **Query Engine** | Presto / Trino Distributed SQL | **Amazon Athena** | Serverless / Private |
| **Security** | IAM Role (Instance Profile) | **AWS IAM** | Zero static credentials in code |

---

## Prerequisites

Before beginning deployment, ensure you have:
1. An active **AWS Account** with permissions to manage IAM, S3, Athena, App Runner, and Amplify.
2. A **GitHub Account** to host the source code repository.
3. Git installed on your computer.

---

## Step 1: Prepare Code and Push to GitHub

### 1.1 Verify Secrets Are Ignored
Ensure that `.gitignore` prevents sensitive files like `.env`, virtual environments, and node modules from being committed:
```bash
git status
```
Verify that `backend/.env` is NOT listed in untracked files. Only `.env.example` templates should be committed.

### 1.2 Initialize Git & Commit
Run the following in the project root (`d:/AWS`):
```bash
git init
git add .
git commit -m "feat: production deployment preparation for AWS Amplify and App Runner"
```

### 1.3 Push to GitHub
1. Create a new repository on [GitHub](https://github.com/new) named `aws-usage-report-analysis` (public or private).
2. Link your local repository and push:
```bash
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/aws-usage-report-analysis.git
git push -u origin main
```

---

## Step 2: Create S3 Buckets and Athena Resources

### 2.1 Create S3 Buckets
In the AWS Console (in your preferred region, e.g., `ap-south-1` or `us-east-1`):
1. Navigate to **Amazon S3** -> **Create bucket**.
2. **Data Bucket**: e.g., `aws-usage-analytics-data-<YOUR_ACCOUNT_ID>`
   - Region: Same region for all resources (e.g. `ap-south-1` or `us-east-1`).
   - Block all public access: **Enabled** (Keep private).
   - Encryption: Amazon S3-managed keys (SSE-S3).
3. **Athena Results Bucket**: e.g., `aws-athena-query-results-<YOUR_ACCOUNT_ID>`
   - Block all public access: **Enabled**.

### 2.2 Upload Initial Usage Dataset
1. In your data bucket (`aws-usage-analytics-data-<YOUR_ACCOUNT_ID>`), create a folder named `raw-usage-data/`.
2. Upload the sample file `data/sample_aws_usage.csv` into `raw-usage-data/`.

### 2.3 Set Up Amazon Athena Database & Table
1. Open **Amazon Athena** in the AWS Console.
2. If prompted for query result location, click **Settings** -> **Manage** and set location to:
   `s3://aws-athena-query-results-<YOUR_ACCOUNT_ID>/athena-results/`
3. In the Athena Query Editor, run:
```sql
CREATE DATABASE IF NOT EXISTS aws_usage_db;
```
4. Create the external table:
```sql
CREATE EXTERNAL TABLE IF NOT EXISTS aws_usage_db.aws_usage_reports (
  invoice_id string,
  billing_period string,
  usage_date string,
  service string,
  service_category string,
  usage_type string,
  operation string,
  usage_amount double,
  unit string,
  currency string,
  blended_rate double,
  unblended_cost double,
  resource_id string,
  region string,
  availability_zone string,
  environment string,
  project string,
  department string,
  cost_center string,
  charge_type string
)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
  'separatorChar' = ',',
  'quoteChar' = '\"',
  'escapeChar' = '\\'
)
LOCATION 's3://aws-usage-analytics-data-<YOUR_ACCOUNT_ID>/raw-usage-data/'
TBLPROPERTIES ('skip.header.line.count'='1');
```
5. Test with a query:
```sql
SELECT count(*) FROM aws_usage_db.aws_usage_reports;
```

---

## Step 3: Create Least-Privilege IAM Role for AWS App Runner

AWS App Runner uses an **Instance Role** to securely call S3 and Athena without requiring API keys or passwords.

### 3.1 Create the IAM Policy
1. Go to **AWS IAM** -> **Policies** -> **Create policy**.
2. Select **JSON** tab and paste the following policy (replace `<DATA_BUCKET>`, `<ATHENA_BUCKET>`, `<REGION>`, and `<ACCOUNT_ID>`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3DataAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket",
        "s3:PutObject",
        "s3:HeadBucket"
      ],
      "Resource": [
        "arn:aws:s3:::aws-usage-analytics-data-<YOUR_ACCOUNT_ID>",
        "arn:aws:s3:::aws-usage-analytics-data-<YOUR_ACCOUNT_ID>/*",
        "arn:aws:s3:::aws-athena-query-results-<YOUR_ACCOUNT_ID>",
        "arn:aws:s3:::aws-athena-query-results-<YOUR_ACCOUNT_ID>/*"
      ]
    },
    {
      "Sid": "AthenaQueryExecution",
      "Effect": "Allow",
      "Action": [
        "athena:StartQueryExecution",
        "athena:GetQueryExecution",
        "athena:GetQueryResults",
        "athena:StopQueryExecution",
        "athena:GetWorkGroup",
        "athena:ListWorkGroups"
      ],
      "Resource": [
        "arn:aws:athena:<REGION>:<ACCOUNT_ID>:workgroup/primary",
        "arn:aws:athena:<REGION>:<ACCOUNT_ID>:workgroup/*"
      ]
    },
    {
      "Sid": "GlueCatalogMetadataRead",
      "Effect": "Allow",
      "Action": [
        "glue:GetDatabase",
        "glue:GetDatabases",
        "glue:GetTable",
        "glue:GetTables",
        "glue:GetPartitions"
      ],
      "Resource": [
        "arn:aws:glue:<REGION>:<ACCOUNT_ID>:catalog",
        "arn:aws:glue:<REGION>:<ACCOUNT_ID>:database/aws_usage_db",
        "arn:aws:glue:<REGION>:<ACCOUNT_ID>:table/aws_usage_db/*"
      ]
    }
  ]
}
```
3. Name the policy: `AWSUsageAppRunnerBackendPolicy`.

### 3.2 Create the IAM Role
1. In IAM -> **Roles** -> **Create role**.
2. Trusted entity type: **AWS Service** -> Select **App Runner** (or **Custom trust policy** if App Runner is not in dropdown):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "tasks.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```
3. Attach the `AWSUsageAppRunnerBackendPolicy` created above.
4. Name the role: `AWSUsageAppRunnerInstanceRole`.

---

## Step 4: Deploy Backend to AWS App Runner

### 4.1 Create App Runner Service
1. Open **AWS App Runner** in the AWS Console.
2. Click **Create service**.
3. **Source**:
   - Repository type: **Source code repository**
   - Connect your GitHub account and select `aws-usage-report-analysis`
   - Branch: `main`
   - Deployment trigger: **Automatic** (re-deploys on every git push)
4. **Configure build**:
   - Configuration file: **Configure all settings here**
   - Runtime: **Python 3**
   - Build command:
     ```bash
     pip install -r backend/requirements.txt
     ```
   - Start command:
     ```bash
     python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000
     ```
   - Port: `8000`

### 4.2 Configure Service & Security
1. **Service name**: `aws-usage-backend-api`
2. **Virtual CPU & Memory**: `1 vCPU`, `2 GB`
3. **Environment variables**:
   Add the following environment variables:

   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `DATA_SOURCE` | `aws` (or `mock` for demo) | `aws` connects live S3/Athena |
   | `AWS_REGION` | `ap-south-1` (or your region) | AWS Deployment Region |
   | `S3_BUCKET_NAME` | `aws-usage-analytics-data-<ACCOUNT_ID>` | Your S3 usage bucket |
   | `S3_PREFIX` | `raw-usage-data/` | Prefix where CSVs are stored |
   | `ATHENA_DATABASE` | `aws_usage_db` | Athena Database Name |
   | `ATHENA_TABLE` | `aws_usage_reports` | Athena Table Name |
   | `ATHENA_WORKGROUP` | `primary` | Athena Workgroup |
   | `ATHENA_OUTPUT_LOCATION`| `s3://aws-athena-query-results-<ACCOUNT_ID>/athena-results/` | Output location for Athena queries |
   | `CORS_ORIGINS` | `http://localhost:5173` | (Will be updated with Amplify URL in Step 6) |
   | `ENVIRONMENT` | `production` | Production environment flag |

4. **Security -> Instance Role**:
   - Select the `AWSUsageAppRunnerInstanceRole` created in Step 3.
5. Click **Next** -> **Create & Deploy**.

### 4.3 Verify App Runner Deployment
Once deployment completes (Status: `Running`):
1. Copy the **Default domain** URL (e.g., `https://abc123xyz.ap-south-1.awsapprunner.com`).
2. Test the public health endpoint in your browser:
   `https://abc123xyz.ap-south-1.awsapprunner.com/api/health`
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "aws-usage-report-analysis-api",
     "version": "1.0.0",
     "data_source": "aws",
     "uptime_seconds": 12.4,
     "environment": "production"
   }
   ```
3. Test OpenAPI interactive documentation:
   `https://abc123xyz.ap-south-1.awsapprunner.com/docs`

---

## Step 5: Deploy Frontend to AWS Amplify Hosting

### 5.1 Connect GitHub to AWS Amplify
1. Open **AWS Amplify** in the AWS Console.
2. Click **Host web app** (or **New app** -> **Host web app**).
3. Select **GitHub** as the source repository and authorize AWS Amplify.
4. Select repository `aws-usage-report-analysis` and branch `main`.

### 5.2 Configure Build Settings
Amplify automatically detects `amplify.yml` in the repository:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci --prefer-offline || npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

### 5.3 Set Frontend Environment Variable
In the **App settings** -> **Environment variables** section:
- Add Variable:
  - **Key**: `VITE_API_URL`
  - **Value**: `https://<YOUR_APP_RUNNER_DOMAIN>.awsapprunner.com/api`
  *(Example: `https://abc123xyz.ap-south-1.awsapprunner.com/api`)*

> [!IMPORTANT]
> Do NOT add any AWS Access Keys or Secrets here. The frontend only talks to the FastAPI backend URL.

### 5.4 Configure Single Page Application (SPA) Rewrites
To ensure deep links and page refreshes work for `/dashboard`, `/costs`, `/services`, etc.:
1. In Amplify Console, navigate to **App settings** -> **Rewrites and redirects**.
2. Click **Edit** and ensure this rule exists:
   - **Source address**: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
   - **Target address**: `/index.html`
   - **Type**: `200 (Rewrite)`
3. Click **Save**.

### 5.5 Deploy
Click **Save and deploy**. Amplify will build and publish your React application.
Once completed, you will receive your public HTTPS URL:
`https://main.<unique-id>.amplifyapp.com`

---

## Step 6: Link Frontend & Backend CORS

1. Copy your Amplify frontend domain: `https://main.<unique-id>.amplifyapp.com`
2. Open **AWS App Runner** -> Select your `aws-usage-backend-api` service.
3. Navigate to **Configuration** -> **Configure service** -> **Environment variables**.
4. Update `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://main.<unique-id>.amplifyapp.com,http://localhost:5173
   ```
5. Click **Save changes**. App Runner will automatically apply the new CORS settings.

---

## Step 7: Verification & Testing from Any Device

Open the public Amplify URL (`https://main.<unique-id>.amplifyapp.com`) from any external computer, laptop, tablet, or phone.

### Checklist:
- [ ] **Dashboard Loads**: KPIs for total spend, monthly trends, and charts render smoothly.
- [ ] **Cost Analysis**: Pareto 80/20 spend analysis, environment breakdown, and top 20 resources display.
- [ ] **Usage Analysis**: Service usage volumes and unit rates are visible.
- [ ] **Services Directory**: Search and filter through all provisioned AWS services.
- [ ] **Report Generator**: Click "Export PDF Report" or "Export CSV" to download on-demand reports.
- [ ] **Settings & AWS Status**: Shows active data source mode, region, S3 bucket status, and Athena query status.
- [ ] **Zero Localhost**: Inspect browser Network tab to verify all requests are sent over HTTPS to your App Runner domain.

---

## Step 8: AWS Cost Safety & Resource Optimization

As this is a student project, follow these cost-saving recommendations:

| Service | Cost Optimization Strategy | Typical Monthly Cost |
| :--- | :--- | :--- |
| **AWS Amplify** | Free tier includes 1,000 build minutes/month and 15 GB served. | $0.00 |
| **AWS App Runner** | Scale to 1 instance; pause the service during non-working hours if needed. | ~$5 - $15 |
| **Amazon S3** | Standard storage for small datasets (< 1 GB) is pennies. | < $0.10 |
| **Amazon Athena** | $5.00 per TB scanned. In-memory caching prevents repeated scans. | < $0.50 |
| **AWS Glue** | Free tier includes metadata storage. | $0.00 |

### To Pause or Clean Up Resources:
1. **Pause App Runner**: Open App Runner -> Actions -> **Pause service** (stops compute billing).
2. **Delete Demo S3 Files**: Delete objects inside `raw-usage-data/` and `athena-results/`.
3. **Delete Amplify App**: Delete the app from the Amplify Console when no longer needed.

---

## Troubleshooting Guide

### Issue 1: CORS Error in Browser Console (`Access-Control-Allow-Origin`)
- **Cause**: Backend does not recognize the Amplify origin.
- **Fix**: In App Runner environment variables, ensure `CORS_ORIGINS` exactly matches your Amplify URL without trailing slashes (e.g. `https://main.d12345.amplifyapp.com`).

### Issue 2: Frontend Shows 404 on Page Refresh
- **Cause**: Amplify rewrite rule missing for React Router SPA.
- **Fix**: In Amplify Console -> **Rewrites and redirects**, ensure `/*` -> `/index.html` (Status: 200 Rewrite) is active.

### Issue 3: Backend Returns 500 on Athena Queries
- **Cause**: IAM Instance Role lacks S3 or Athena permissions.
- **Fix**: Verify `AWSUsageAppRunnerInstanceRole` has permissions to:
  - Read from data bucket
  - Write to Athena results location (`s3://.../athena-results/`)
  - Execute Athena queries in `primary` workgroup

### Issue 4: Backend Health Check Fails During App Runner Deployment
- **Cause**: App Runner health check timeout or wrong port.
- **Fix**: Ensure App Runner Port is configured as `8000`, and health check path is set to `/api/health`.
