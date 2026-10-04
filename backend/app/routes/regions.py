from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException
from app.models.schemas import RegionCostItem, FilterParams
from app.services.mock_data_service import mock_data_service

router = APIRouter(prefix="/regions", tags=["AWS Regions"])

@router.get("", response_model=List[RegionCostItem], summary="Get Regional Spend Breakdown")
async def get_regions(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    service: Optional[List[str]] = Query(None, description="Filter by service(s)")
):
    """
    Returns list of all active AWS deployment regions with friendly names,
    total spend, percentage share of infrastructure cost, service counts, and resource counts.
    """
    filters = FilterParams(
        start_date=start_date,
        end_date=end_date,
        services=service
    )
    try:
        return mock_data_service.get_regions_summary(filters)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch regions: {str(e)}")
