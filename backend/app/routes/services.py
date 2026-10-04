from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException
from app.models.schemas import ServiceDetailItem, FilterParams
from app.services.cache_service import cache_service
from app.services.mock_data_service import mock_data_service

router = APIRouter(prefix="/services", tags=["AWS Services"])

@router.get("", response_model=List[ServiceDetailItem], summary="Get AWS Services Summary Table")
async def get_services(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    region: Optional[List[str]] = Query(None, description="Filter by region(s)")
):
    """
    Returns list of all active AWS services with:
    - Service Name & Functional Category (Compute, Storage, Database, Serverless, etc.)
    - Aggregate Cost (USD) & Percentage of Total Bill
    - Total Usage Quantity & Unit
    - Primary AWS Region
    - Number of Unique Resources
    - Month-over-Month % Change
    - Top Usage Meter
    """
    filters = FilterParams(
        start_date=start_date,
        end_date=end_date,
        regions=region
    )
    try:
        return mock_data_service.get_services_summary(filters)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch services: {str(e)}")
