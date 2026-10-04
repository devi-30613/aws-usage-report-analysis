from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException
from app.config import settings
from app.models.schemas import UsageAnalysisResponse, FilterParams
from app.services.cache_service import cache_service
from app.services.mock_data_service import mock_data_service

router = APIRouter(prefix="/usage", tags=["Usage Analysis"])

@router.get("", response_model=UsageAnalysisResponse, summary="Get Detailed Usage Analysis")
async def get_usage_analysis(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    service: Optional[List[str]] = Query(None, description="Filter by AWS service(s)"),
    region: Optional[List[str]] = Query(None, description="Filter by AWS region(s)"),
    use_cache: bool = Query(True, description="Enable response caching")
):
    """
    Returns usage consumption analytics:
    - Service usage volumes and unit counts (Hrs, GB-Mo, Requests, etc.)
    - Usage type meters with effective per-unit pricing rates
    - Monthly usage trends across key services
    - Regional workload distribution
    - Top resource consumers
    """
    filters = FilterParams(
        start_date=start_date,
        end_date=end_date,
        services=service,
        regions=region
    )

    cache_key = cache_service._generate_key("usage", **filters.model_dump())
    if use_cache:
        cached = cache_service.get(cache_key)
        if cached:
            return cached

    try:
        res = mock_data_service.get_usage_analysis(filters)
        if settings.data_source.lower() == "aws":
            res.data_source = "aws"
            
        if use_cache:
            cache_service.set(cache_key, res, ttl=settings.cache_ttl_seconds)

        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate usage analysis: {str(e)}")
