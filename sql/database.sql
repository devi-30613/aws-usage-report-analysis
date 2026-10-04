-- ====================================================================
-- AWS Athena Database Definition
-- AWS Usage & Report Analysis Platform
-- ====================================================================

-- Create Athena Database / Glue Catalog Database for AWS Usage Data
CREATE DATABASE IF NOT EXISTS aws_usage_db
COMMENT 'Database storing AWS usage, billing metrics, and cost reports for analysis'
LOCATION 's3://your-aws-usage-bucket-name/database/';
