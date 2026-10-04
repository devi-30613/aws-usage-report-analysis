-- ====================================================================
-- AWS Athena Cost Analysis Queries
-- AWS Usage & Report Analysis Platform
-- ====================================================================

-- 1. Cost by AWS Service (With Percentage Contribution)
WITH total AS (
    SELECT SUM(cost) AS grand_total FROM aws_usage_db.aws_usage_reports
)
SELECT 
    r.service,
    ROUND(SUM(r.cost), 2) AS total_cost,
    ROUND((SUM(r.cost) / MAX(t.grand_total)) * 100, 2) AS percentage_contribution,
    COUNT(DISTINCT r.resource_id) AS resources_count,
    ROUND(AVG(r.cost), 2) AS avg_daily_cost
FROM aws_usage_db.aws_usage_reports r
CROSS JOIN total t
GROUP BY r.service
ORDER BY total_cost DESC;

-- 2. Cost by AWS Region
SELECT 
    region,
    ROUND(SUM(cost), 2) AS total_cost,
    ROUND((SUM(cost) / (SELECT SUM(cost) FROM aws_usage_db.aws_usage_reports)) * 100, 2) AS percentage_share,
    COUNT(DISTINCT service) AS services_used
FROM aws_usage_db.aws_usage_reports
GROUP BY region
ORDER BY total_cost DESC;

-- 3. Daily Cost Trend (Last 30/90 Days)
SELECT 
    date,
    ROUND(SUM(cost), 2) AS daily_cost,
    ROUND(SUM(CASE WHEN service = 'Amazon EC2' THEN cost ELSE 0 END), 2) AS ec2_cost,
    ROUND(SUM(CASE WHEN service = 'Amazon RDS' THEN cost ELSE 0 END), 2) AS rds_cost,
    ROUND(SUM(CASE WHEN service = 'Amazon S3' THEN cost ELSE 0 END), 2) AS s3_cost,
    ROUND(SUM(CASE WHEN service NOT IN ('Amazon EC2', 'Amazon RDS', 'Amazon S3') THEN cost ELSE 0 END), 2) AS other_cost
FROM aws_usage_db.aws_usage_reports
WHERE date >= '2026-01-01' AND date <= '2026-10-01'
GROUP BY date
ORDER BY date ASC;

-- 4. Highest-Cost Individual Resources
SELECT 
    resource_id,
    service,
    region,
    tag_environment,
    tag_project,
    ROUND(SUM(cost), 2) AS total_resource_cost,
    ROUND(SUM(usage_quantity), 2) AS total_usage_volume
FROM aws_usage_db.aws_usage_reports
GROUP BY resource_id, service, region, tag_environment, tag_project
ORDER BY total_resource_cost DESC
LIMIT 15;

-- 5. Cost Breakdown by Environment (Production vs Staging vs Development)
SELECT 
    tag_environment,
    ROUND(SUM(cost), 2) AS total_cost,
    ROUND((SUM(cost) / (SELECT SUM(cost) FROM aws_usage_db.aws_usage_reports)) * 100, 2) AS environment_share_pct
FROM aws_usage_db.aws_usage_reports
GROUP BY tag_environment
ORDER BY total_cost DESC;
