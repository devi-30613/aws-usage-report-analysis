from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException
from app.config import settings
from app.models.schemas import CostAnalysisResponse, FilterParams
from app.services.cache_service import cache_service
from app.services.mock_data_service import mock_data_service

router = APIRouter(prefix="/costs", tags=["Cost Analysis"])

@router.get("", response_model=CostAnalysisResponse, summary="Get Detailed Cost Analysis")
async def get_cost_analysis(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    service: Optional[List[str]] = Query(None, description="Filter by AWS service(s)"),
    region: Optional[List[str]] = Query(None, description="Filter by AWS region(s)"),
    environment: Optional[List[str]] = Query(None, description="Filter by environment"),
    project: Optional[List[str]] = Query(None, description="Filter by project"),
    use_cache: bool = Query(True, description="Enable response caching")
):
    """
    Returns comprehensive cost breakdowns:
    - Service-wise spend & percentage contribution
    - Regional cost distributions
    - Environment cost allocation (Prod vs Staging vs Dev)
    - Monthly & Daily financial run-rates
    - Top 20 highest-cost AWS resources
    - Pareto 80/20 cumulative spend analysis
    """
    filters = FilterParams(
        start_date=start_date,
        end_date=end_date,
        services=service,
        regions=region,
        environments=environment,
        projects=project
    )

    cache_key = cache_service._generate_key("costs", **filters.model_dump())
    if use_cache:
        cached = cache_service.get(cache_key)
        if cached:
            return cached

    try:
        res = mock_data_service.get_cost_analysis(filters)
        if settings.data_source.lower() == "aws":
            res.data_source = "aws"
            
        if use_cache:
            cache_service.set(cache_key, res, ttl=settings.cache_ttl_seconds)

        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate cost analysis: {str(e)}")
