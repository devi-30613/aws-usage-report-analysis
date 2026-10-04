-- ====================================================================
-- AWS Athena Dashboard Queries
-- AWS Usage & Report Analysis Platform
-- ====================================================================

-- 1. High-Level Summary KPIs (All-time or Filtered Period)
SELECT 
    ROUND(SUM(cost), 2) AS total_cost,
    ROUND(SUM(usage_quantity), 2) AS total_usage,
    COUNT(DISTINCT service) AS distinct_services_count,
    COUNT(DISTINCT region) AS distinct_regions_count,
    COUNT(DISTINCT resource_id) AS distinct_resources_count,
    COUNT(*) AS total_records_count
FROM aws_usage_db.aws_usage_reports;

-- 2. Current Month vs Previous Month Cost & Change %
WITH monthly_spend AS (
    SELECT 
        substr(date, 1, 7) AS billing_month,
        SUM(cost) AS month_cost
    FROM aws_usage_db.aws_usage_reports
    GROUP BY substr(date, 1, 7)
),
ranked_months AS (
    SELECT 
        billing_month,
        month_cost,
        LAG(month_cost, 1) OVER (ORDER BY billing_month) AS prev_month_cost
    FROM monthly_spend
)
SELECT 
    billing_month,
    ROUND(month_cost, 2) AS current_month_cost,
    ROUND(prev_month_cost, 2) AS previous_month_cost,
    ROUND(((month_cost - prev_month_cost) / NULLIF(prev_month_cost, 0)) * 100, 2) AS mom_change_pct
FROM ranked_months
ORDER BY billing_month DESC
LIMIT 1;

-- 3. Monthly Cost Trend (Historical)
SELECT 
    substr(date, 1, 7) AS month,
    ROUND(SUM(cost), 2) AS total_cost,
    ROUND(SUM(usage_quantity), 2) AS total_usage,
    COUNT(DISTINCT service) AS active_services
FROM aws_usage_db.aws_usage_reports
GROUP BY substr(date, 1, 7)
ORDER BY month ASC;

-- 4. Top Most Expensive Service
SELECT 
    service,
    ROUND(SUM(cost), 2) AS service_total_cost,
    ROUND((SUM(cost) / (SELECT SUM(cost) FROM aws_usage_db.aws_usage_reports)) * 100, 2) AS cost_share_pct
FROM aws_usage_db.aws_usage_reports
GROUP BY service
ORDER BY service_total_cost DESC
LIMIT 1;

-- 5. Recent Activity / Latest Usage Records
SELECT 
    date,
    service,
    region,
    usage_type,
    ROUND(usage_quantity, 2) AS usage_quantity,
    usage_unit,
    ROUND(cost, 2) AS cost,
    resource_id,
    tag_environment
FROM aws_usage_db.aws_usage_reports
ORDER BY date DESC, cost DESC
LIMIT 10;
