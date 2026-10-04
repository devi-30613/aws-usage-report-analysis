from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class FilterParams(BaseModel):
    start_date: Optional[str] = Field(None, description="Start date in YYYY-MM-DD format")
    end_date: Optional[str] = Field(None, description="End date in YYYY-MM-DD format")
    services: Optional[List[str]] = Field(None, description="List of AWS services to filter")
    regions: Optional[List[str]] = Field(None, description="List of AWS regions to filter")
    environments: Optional[List[str]] = Field(None, description="List of environments (e.g. Production)")
    projects: Optional[List[str]] = Field(None, description="List of projects")

class KpiMetrics(BaseModel):
    total_cost: float = Field(..., description="Total cost in USD")
    current_month_cost: float = Field(..., description="Current/latest month spend in USD")
    previous_month_cost: float = Field(..., description="Previous month spend in USD")
    cost_change_percentage: float = Field(..., description="Month-over-month cost change percentage")
    total_usage: float = Field(..., description="Total aggregate usage metric units")
    total_services_count: int = Field(..., description="Number of active AWS services")
    total_regions_count: int = Field(..., description="Number of active AWS regions")
    total_resources_count: int = Field(..., description="Number of unique tracked resources")
    most_expensive_service: str = Field(..., description="Service with the highest cost")
    most_expensive_service_cost: float = Field(..., description="Cost of the top service")
    highest_cost_region: str = Field(..., description="Region with the highest cost")

class MonthlyCostItem(BaseModel):
    month: str
    total_cost: float
    total_usage: float
    service_count: int

class ServiceCostItem(BaseModel):
    service: str
    total_cost: float
    percentage_contribution: float
    resource_count: int
    primary_region: str
    usage_quantity: float
    usage_unit: str

class RegionCostItem(BaseModel):
    region: str
    region_name: str
    total_cost: float
    percentage_share: float
    services_count: int
    resources_count: int

class DailyCostTrendItem(BaseModel):
    date: str
    total_cost: float
    breakdown_by_service: Optional[Dict[str, float]] = None

class RecentActivityItem(BaseModel):
    date: str
    service: str
    region: str
    usage_type: str
    usage_quantity: float
    usage_unit: str
    cost: float
    resource_id: str
    tag_environment: Optional[str] = "Production"
    tag_project: Optional[str] = "Core"

class RecommendationItem(BaseModel):
    id: str
    title: str
    category: str  # Cost Optimization, Anomaly, Resource Sizing, Security/Governance
    severity: str  # HIGH, MEDIUM, LOW, INFO
    impact_usd: Optional[float] = None
    description: str
    action: str

class DashboardResponse(BaseModel):
    kpis: KpiMetrics
    monthly_costs: List[MonthlyCostItem]
    service_costs: List[ServiceCostItem]
    region_costs: List[RegionCostItem]
    daily_trend: List[DailyCostTrendItem]
    recent_activity: List[RecentActivityItem]
    insights: List[RecommendationItem]
    data_source: str
    cached: bool = False
    query_time_ms: float = 0.0

class CostAnalysisResponse(BaseModel):
    total_cost: float
    service_breakdown: List[ServiceCostItem]
    region_breakdown: List[RegionCostItem]
    environment_breakdown: List[Dict[str, Any]]
    monthly_trend: List[MonthlyCostItem]
    daily_trend: List[DailyCostTrendItem]
    highest_cost_resources: List[Dict[str, Any]]
    pareto_analysis: List[Dict[str, Any]]
    data_source: str

class UsageAnalysisResponse(BaseModel):
    total_usage_records: int
    service_usage: List[Dict[str, Any]]
    usage_type_breakdown: List[Dict[str, Any]]
    monthly_usage_trend: List[Dict[str, Any]]
    regional_usage: List[Dict[str, Any]]
    top_resource_consumers: List[Dict[str, Any]]
    data_source: str

class ServiceDetailItem(BaseModel):
    service: str
    category: str
    total_cost: float
    total_usage: float
    usage_unit: str
    primary_region: str
    resource_count: int
    cost_change_percentage: float
    top_usage_type: str
    cost_share_pct: float

class AwsStatusResponse(BaseModel):
    data_source: str
    is_aws_connected: bool
    aws_region: str
    athena_database: str
    athena_table: str
    athena_workgroup: str
    athena_output_bucket: str
    s3_bucket: str
    s3_status: str
    latest_data_upload: str
    total_records_count: int
    athena_query_status: str
    last_query_execution_time_ms: float
    cache_hit_rate_pct: float
    cached_queries_count: int

class ReportGenerateRequest(BaseModel):
    report_title: Optional[str] = "AWS Usage & Cost Analysis Report"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    services: Optional[List[str]] = None
    regions: Optional[List[str]] = None
    format: str = "json"  # "json", "csv", "pdf"
    include_recommendations: bool = True
    include_raw_records: bool = False

class ReportSummaryResponse(BaseModel):
    report_id: str
    generated_at: str
    filters_applied: Dict[str, Any]
    summary_metrics: Dict[str, Any]
    top_services: List[Dict[str, Any]]
    top_regions: List[Dict[str, Any]]
    monthly_trend: List[Dict[str, Any]]
    insights: List[RecommendationItem]
    download_urls: Dict[str, str]
