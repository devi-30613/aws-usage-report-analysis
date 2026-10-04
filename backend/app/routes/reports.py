from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, Response, Body
from fastapi.responses import Response
from app.models.schemas import ReportGenerateRequest, ReportSummaryResponse
from app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate", summary="Generate Custom AWS Cost & Usage Report")
async def generate_report(req: ReportGenerateRequest = Body(...)):
    """
    Generates a structured report based on selected time horizon, services, and regions.
    Returns executive summary metrics, breakdown tables, and downloadable endpoints.
    """
    try:
        report_data = report_service.generate_report_data(req)
        report_id = report_data["report_id"]

        return {
            "report_id": report_id,
            "title": report_data["title"],
            "generated_at": report_data["generated_at"],
            "filters": report_data["filters"],
            "summary_metrics": report_data["summary_metrics"],
            "service_breakdown": report_data["service_breakdown"],
            "region_breakdown": report_data["region_breakdown"],
            "monthly_trend": report_data["monthly_trend"],
            "environment_breakdown": report_data.get("environment_breakdown", []),
            "top_resources": report_data.get("top_resources", []),
            "insights": report_data.get("insights", []),
            "download_urls": {
                "pdf": f"/api/reports/download/pdf?report_id={report_id}&start_date={req.start_date or ''}&end_date={req.end_date or ''}",
                "csv": f"/api/reports/download/csv?report_id={report_id}&start_date={req.start_date or ''}&end_date={req.end_date or ''}"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@router.get("/download/pdf", summary="Download Report as PDF")
async def download_report_pdf(
    report_title: Optional[str] = Query("AWS Usage & Cost Analysis Report"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    service: Optional[List[str]] = Query(None),
    region: Optional[List[str]] = Query(None)
):
    """Generates and streams a formatted PDF report."""
    try:
        req = ReportGenerateRequest(
            report_title=report_title,
            start_date=start_date,
            end_date=end_date,
            services=service,
            regions=region
        )
        report_data = report_service.generate_report_data(req)
        pdf_bytes = report_service.generate_pdf_bytes(report_data)

        filename = f"aws_usage_report_{report_data['report_id']}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

@router.get("/download/csv", summary="Download Report as CSV")
async def download_report_csv(
    report_title: Optional[str] = Query("AWS Usage & Cost Analysis Report"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    service: Optional[List[str]] = Query(None),
    region: Optional[List[str]] = Query(None)
):
    """Generates and streams a formatted CSV report."""
    try:
        req = ReportGenerateRequest(
            report_title=report_title,
            start_date=start_date,
            end_date=end_date,
            services=service,
            regions=region
        )
        report_data = report_service.generate_report_data(req)
        csv_bytes = report_service.generate_csv_bytes(report_data)

        filename = f"aws_usage_report_{report_data['report_id']}.csv"
        return Response(
            content=csv_bytes,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate CSV: {str(e)}")
