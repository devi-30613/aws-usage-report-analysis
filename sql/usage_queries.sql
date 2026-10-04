-- ====================================================================
-- AWS Athena Usage Analysis Queries
-- AWS Usage & Report Analysis Platform
-- ====================================================================

-- 1. Total Usage Volume & Units by Service
SELECT 
    service,
    usage_unit,
    ROUND(SUM(usage_quantity), 2) AS total_quantity,
    ROUND(AVG(usage_quantity), 2) AS avg_daily_quantity,
    ROUND(MAX(usage_quantity), 2) AS peak_usage,
    ROUND(SUM(cost), 2) AS associated_cost
FROM aws_usage_db.aws_usage_reports
GROUP BY service, usage_unit
ORDER BY associated_cost DESC;

-- 2. Usage Breakdown by Usage Type Meter
SELECT 
    service,
    usage_type,
    usage_unit,
    ROUND(SUM(usage_quantity), 2) AS total_usage,
    ROUND(SUM(cost), 2) AS total_cost,
    ROUND(SUM(cost) / NULLIF(SUM(usage_quantity), 0), 4) AS effective_rate_per_unit
FROM aws_usage_db.aws_usage_reports
GROUP BY service, usage_type, usage_unit
ORDER BY total_cost DESC
LIMIT 25;

-- 3. Monthly Usage Volume Trend across Top Services
SELECT 
    substr(date, 1, 7) AS month,
    service,
    ROUND(SUM(usage_quantity), 2) AS monthly_usage_quantity,
    ROUND(SUM(cost), 2) AS monthly_cost
FROM aws_usage_db.aws_usage_reports
GROUP BY substr(date, 1, 7), service
ORDER BY month ASC, monthly_cost DESC;

-- 4. Regional Usage Distribution
SELECT 
    region,
    service,
    ROUND(SUM(usage_quantity), 2) AS regional_usage,
    ROUND(SUM(cost), 2) AS regional_cost
FROM aws_usage_db.aws_usage_reports
GROUP BY region, service
ORDER BY regional_cost DESC;
