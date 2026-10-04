import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routes import health, dashboard, costs, usage, services, regions, reports, aws_status, aws

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("app")

app = FastAPI(
    title="AWS Usage & Report Analysis API",
    description="""
    ## AWS Cloud Financial Management & Usage Analytics Engine
    
    This production-grade API processes AWS billing & usage metrics, runs analytics aggregations,
    interfaces with **Amazon S3** & **Amazon Athena**, and provides real-time insights, Pareto distributions,
    and downloadable PDF/CSV executive reports.
    
    ### Key Features:
    * **Executive KPIs & Metrics**: Total spend, MoM variations, top cost contributors.
    * **Cost Analytics**: Service breakdowns, regional footprints, environment distributions, 80/20 Pareto spend analysis.
    * **Usage Analytics**: Service volume consumption, unit rates, peak usage metrics.
    * **Automated Insights**: Rule-based cost anomaly detection and actionable AWS savings recommendations.
    * **Report Generation**: On-the-fly CSV and PDF generation.
    * **Athena & S3 Integration**: Boto3 query lifecycle management with intelligent caching.
    * **Resilient Architecture**: Dual-mode operational support (`mock` development mode & `aws` live mode).
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware - configurable for local development and production AWS Amplify domains
cors_origins = settings.cors_origin_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https?:\/\/.*\.amplifyapp\.com$",
    allow_credentials=True if cors_origins != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred while processing the cloud analytics request."}
    )

# Include API Routes with /api prefix
api_prefix = "/api"
app.include_router(health.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(costs.router, prefix=api_prefix)
app.include_router(usage.router, prefix=api_prefix)
app.include_router(services.router, prefix=api_prefix)
app.include_router(regions.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(aws.router, prefix=api_prefix)
app.include_router(aws_status.router, prefix=api_prefix)

@app.get("/", tags=["Root"])
async def root():
    return {
        "name": "AWS Usage & Report Analysis API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
        "data_source": settings.data_source
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
