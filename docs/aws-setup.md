# AWS Infrastructure Setup Guide

This guide walks through configuring Amazon S3, AWS Glue Data Catalog, Amazon Athena, and IAM credentials for the **AWS Usage & Report Analysis Platform**.

---

## 1. Create Amazon S3 Buckets

You will need two S3 buckets (or one bucket with two prefixes):

1. **Data Bucket**: For storing raw/processed AWS usage data.
   * Bucket Name: `my-aws-usage-reports-bucket`
   * Prefix: `raw-usage-data/`
2. **Athena Query Results Bucket**: For Athena query outputs.
   * Bucket Name: `my-athena-query-results-bucket`
   * Prefix: `athena-results/`

### AWS CLI Commands:
```bash
# Create S3 buckets
aws s3 mb s3://my-aws-usage-reports-bucket --region us-east-1
aws s3 mb s3://my-athena-query-results-bucket --region us-east-1

# Upload sample data to S3
aws s3 cp data/sample_aws_usage.csv s3://my-aws-usage-reports-bucket/raw-usage-data/sample_aws_usage.csv
```

---

## 2. Set Up Athena Database & Tables

1. Open the **Amazon Athena Console** in the AWS Management Console.
2. Ensure your Athena Query Result Location is configured:
   `s3://my-athena-query-results-bucket/athena-results/`
3. Execute the SQL scripts provided in the `sql/` directory:

### Step A: Create Database
```sql
CREATE DATABASE IF NOT EXISTS aws_usage_db
COMMENT 'Database for AWS Usage and Billing Reports'
LOCATION 's3://my-aws-usage-reports-bucket/database/';
```

### Step B: Create External Table
```sql
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
ESCAPED BY '\\'
LINES TERMINATED BY '\n'
LOCATION 's3://my-aws-usage-reports-bucket/raw-usage-data/'
TBLPROPERTIES (
    'skip.header.line.count'='1',
    'has_encrypted_data'='false'
);
```

### Step C: Test Query
```sql
SELECT service, COUNT(*) AS records_count, SUM(cost) AS total_cost
FROM aws_usage_db.aws_usage_reports
GROUP BY service
ORDER BY total_cost DESC;
```

---

## 3. Create IAM Policy & User / Role

Create an IAM policy granting the backend permissions to query Athena and access S3.

### IAM Policy (`AthenaS3UsagePolicy.json`):
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AthenaQueryPermissions",
            "Effect": "Allow",
            "Action": [
                "athena:StartQueryExecution",
                "athena:GetQueryExecution",
                "athena:GetQueryResults",
                "athena:StopQueryExecution",
                "athena:GetWorkGroup"
            ],
            "Resource": "*"
        },
        {
            "Sid": "GlueCatalogPermissions",
            "Effect": "Allow",
            "Action": [
                "glue:GetDatabase",
                "glue:GetDatabases",
                "glue:GetTable",
                "glue:GetTables",
                "glue:GetPartitions"
            ],
            "Resource": "*"
        },
        {
            "Sid": "S3BucketAndObjectPermissions",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket",
                "s3:PutObject",
                "s3:GetBucketLocation"
            ],
            "Resource": [
                "arn:aws:s3:::my-aws-usage-reports-bucket",
                "arn:aws:s3:::my-aws-usage-reports-bucket/*",
                "arn:aws:s3:::my-athena-query-results-bucket",
                "arn:aws:s3:::my-athena-query-results-bucket/*"
            ]
        }
    ]
}
```

---

## 4. Configure Backend Environment

Copy `backend/.env.example` to `backend/.env` and update the values:

```env
DATA_SOURCE=aws
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_IAM_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_IAM_SECRET_KEY

ATHENA_DATABASE=aws_usage_db
ATHENA_TABLE=aws_usage_reports
ATHENA_WORKGROUP=primary
ATHENA_OUTPUT_LOCATION=s3://my-athena-query-results-bucket/athena-results/

S3_BUCKET=my-aws-usage-reports-bucket
S3_PREFIX=raw-usage-data/
```

---

## 5. Free-Tier & Cost Awareness

* **Amazon Athena**: Charges $5.00 per TB of data scanned. By filtering with specific date ranges and keeping sample data compressed or small, query costs remain fractions of a cent ($0.0001).
* **Amazon S3**: Free tier includes 5 GB of Standard storage and 20,000 GET requests.
* **Backend Caching**: The built-in 300s TTL cache eliminates repeated scans on frequent dashboard refreshes.
