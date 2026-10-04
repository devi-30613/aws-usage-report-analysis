import time
from fastapi import APIRouter
from app.config import settings
from app.services.cache_service import cache_service

router = APIRouter(prefix="/health", tags=["Health"])

START_TIME = time.time()

@router.get("", summary="API Health Check")
async def health_check():
    """Returns application status, uptime, active data source mode, and cache performance."""
    uptime_seconds = round(time.time() - START_TIME, 1)
    cache_stats = cache_service.stats()
    return {
        "status": "healthy",
        "service": "aws-usage-report-analysis-api",
        "version": "1.0.0",
        "data_source": settings.data_source,
        "uptime_seconds": uptime_seconds,
        "environment": settings.environment,
        "cache": cache_stats
    }
