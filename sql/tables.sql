-- ====================================================================
-- AWS Athena External Table Definition
-- AWS Usage & Report Analysis Platform
-- ====================================================================

-- 1. Standard CSV Table Definition
CREATE EXTERNAL TABLE IF NOT EXISTS aws_usage_db.aws_usage_reports (
    `date` STRING COMMENT 'Billing and usage record date (YYYY-MM-DD)',
    `service` STRING COMMENT 'AWS Service Name (e.g., Amazon EC2, Amazon S3)',
    `region` STRING COMMENT 'AWS Region Code (e.g., us-east-1, eu-west-1)',
    `usage_type` STRING COMMENT 'Specific AWS Usage Type / Meter',
    `usage_quantity` DOUBLE COMMENT 'Numeric quantity of usage consumed',
    `usage_unit` STRING COMMENT 'Unit of measurement (Hrs, GB-Mo, Requests, etc.)',
    `cost` DOUBLE COMMENT 'Billed cost in USD',
    `currency` STRING COMMENT 'Currency code (USD)',
    `resource_id` STRING COMMENT 'AWS Resource Identifier / ARN',
    `account_id` STRING COMMENT 'AWS 12-digit Account ID',
    `tag_environment` STRING COMMENT 'Deployment environment tag (Production, Staging, Dev)',
    `tag_project` STRING COMMENT 'Project or workload tag'
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
ESCAPED BY '\\'
LINES TERMINATED BY '\n'
LOCATION 's3://your-aws-usage-bucket-name/raw-usage-data/'
TBLPROPERTIES (
    'skip.header.line.count'='1',
    'has_encrypted_data'='false'
);

-- 2. Optimized Partitioned Parquet Table (Recommended for Production / Large Datasets)
CREATE EXTERNAL TABLE IF NOT EXISTS aws_usage_db.aws_usage_parquet (
    `service` STRING,
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
PARTITIONED BY (
    `year` STRING,
    `month` STRING,
    `region` STRING
)
STORED AS PARQUET
LOCATION 's3://your-aws-usage-bucket-name/parquet-usage-data/'
TBLPROPERTIES ('parquet.compression'='SNAPPY');
