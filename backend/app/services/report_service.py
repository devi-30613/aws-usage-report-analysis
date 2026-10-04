import io
import csv
import os
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.config import settings
from app.models.schemas import FilterParams, ReportGenerateRequest, ReportSummaryResponse, RecommendationItem
from app.services.mock_data_service import mock_data_service
from app.services.s3_service import s3_service
from app.services.insights_service import InsightsService

class ReportService:
    @staticmethod
    def generate_report_data(req: ReportGenerateRequest) -> Dict[str, Any]:
        filters = FilterParams(
            start_date=req.start_date,
            end_date=req.end_date,
            services=req.services,
            regions=req.regions
        )

        dash = mock_data_service.get_dashboard_data(filters)
        cost_analysis = mock_data_service.get_cost_analysis(filters)

        report_id = f"rpt-{uuid.uuid4().hex[:8]}"
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

        return {
            "report_id": report_id,
            "generated_at": now_str,
            "title": req.report_title or "AWS Usage & Cost Analysis Report",
            "filters": {
                "start_date": req.start_date or "All History",
                "end_date": req.end_date or "Latest",
                "services": req.services or "All Services",
                "regions": req.regions or "All Regions"
            },
            "summary_metrics": {
                "total_cost": dash.kpis.total_cost,
                "current_month_cost": dash.kpis.current_month_cost,
                "previous_month_cost": dash.kpis.previous_month_cost,
                "cost_change_pct": dash.kpis.cost_change_percentage,
                "total_usage_units": dash.kpis.total_usage,
                "active_services_count": dash.kpis.total_services_count,
                "active_regions_count": dash.kpis.total_regions_count,
                "active_resources_count": dash.kpis.total_resources_count,
                "top_service": dash.kpis.most_expensive_service,
                "top_service_cost": dash.kpis.most_expensive_service_cost,
                "top_region": dash.kpis.highest_cost_region
            },
            "service_breakdown": [s.model_dump() for s in dash.service_costs],
            "region_breakdown": [r.model_dump() for r in dash.region_costs],
            "monthly_trend": [m.model_dump() for m in dash.monthly_costs],
            "environment_breakdown": cost_analysis.environment_breakdown,
            "top_resources": cost_analysis.highest_cost_resources[:10],
            "insights": [i.model_dump() for i in dash.insights] if req.include_recommendations else []
        }

    @staticmethod
    def generate_csv_bytes(report_data: Dict[str, Any]) -> bytes:
        output = io.StringIO()
        writer = csv.writer(output)

        # Header summary
        writer.writerow(["AWS USAGE & COST ANALYSIS REPORT"])
        writer.writerow(["Report ID", report_data["report_id"]])
        writer.writerow(["Generated At", report_data["generated_at"]])
        writer.writerow(["Date Range", f"{report_data['filters']['start_date']} to {report_data['filters']['end_date']}"])
        writer.writerow([])

        # Summary KPIs
        writer.writerow(["EXECUTIVE SUMMARY METRICS"])
        writer.writerow(["Metric", "Value"])
        metrics = report_data["summary_metrics"]
        writer.writerow(["Total AWS Cost (USD)", f"${metrics['total_cost']:,.2f}"])
        writer.writerow(["Current Month Spend", f"${metrics['current_month_cost']:,.2f}"])
        writer.writerow(["Previous Month Spend", f"${metrics['previous_month_cost']:,.2f}"])
        writer.writerow(["MoM Cost Change %", f"{metrics['cost_change_pct']}%"])
        writer.writerow(["Top Cost Driver Service", metrics["top_service"]])
        writer.writerow(["Top Cost Driver Region", metrics["top_region"]])
        writer.writerow([])

        # Service Breakdown
        writer.writerow(["SERVICE BREAKDOWN"])
        writer.writerow(["Service", "Cost (USD)", "Contribution (%)", "Resource Count", "Primary Region"])
        for s in report_data.get("service_breakdown", []):
            writer.writerow([
                s.get("service"),
                f"${s.get('total_cost', 0):,.2f}",
                f"{s.get('percentage_contribution', 0):.2f}%",
                s.get("resource_count"),
                s.get("primary_region")
            ])
        writer.writerow([])

        # Region Breakdown
        writer.writerow(["REGIONAL SPEND"])
        writer.writerow(["Region Code", "Region Name", "Cost (USD)", "Share (%)", "Services Count"])
        for r in report_data.get("region_breakdown", []):
            writer.writerow([
                r.get("region"),
                r.get("region_name"),
                f"${r.get('total_cost', 0):,.2f}",
                f"{r.get('percentage_share', 0):.2f}%",
                r.get("services_count")
            ])
        writer.writerow([])

        # Insights & Recommendations
        writer.writerow(["OPTIMIZATION RECOMMENDATIONS"])
        writer.writerow(["Title", "Severity", "Category", "Est. Impact (USD)", "Action"])
        for ins in report_data.get("insights", []):
            impact = f"${ins.get('impact_usd'):,.2f}" if ins.get("impact_usd") else "N/A"
            writer.writerow([
                ins.get("title"),
                ins.get("severity"),
                ins.get("category"),
                impact,
                ins.get("action")
            ])

        return output.getvalue().encode("utf-8")

    @staticmethod
    def generate_pdf_bytes(report_data: Dict[str, Any]) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        # Custom Palette
        aws_orange = colors.HexColor("#EC7211")
        aws_dark = colors.HexColor("#232F3E")
        aws_light_bg = colors.HexColor("#F2F3F3")
        text_dark = colors.HexColor("#16191F")
        accent_blue = colors.HexColor("#0073BB")

        # Custom Typography Styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=22,
            leading=26,
            textColor=aws_dark,
            fontName="Helvetica-Bold",
            spaceAfter=4
        )

        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#545B64"),
            spaceAfter=15
        )

        section_heading = ParagraphStyle(
            "SectionHeading",
            parent=styles["Heading2"],
            fontSize=14,
            leading=18,
            textColor=aws_orange,
            fontName="Helvetica-Bold",
            spaceBefore=12,
            spaceAfter=8
        )

        body_style = ParagraphStyle(
            "BodyTextCustom",
            parent=styles["Normal"],
            fontSize=9,
            leading=12,
            textColor=text_dark
        )

        kpi_label = ParagraphStyle(
            "KpiLabel",
            parent=styles["Normal"],
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#68707F"),
            alignment=1
        )

        kpi_val = ParagraphStyle(
            "KpiVal",
            parent=styles["Normal"],
            fontSize=13,
            leading=16,
            fontName="Helvetica-Bold",
            textColor=aws_dark,
            alignment=1
        )

        elements = []

        # 1. Header & Title Banner
        elements.append(Paragraph(report_data.get("title", "AWS Usage & Cost Analysis Report"), title_style))
        elements.append(Paragraph(
            f"<b>Report ID:</b> {report_data['report_id']} &nbsp;|&nbsp; <b>Generated:</b> {report_data['generated_at']} &nbsp;|&nbsp; <b>Environment:</b> AWS Athena & S3 Analytics",
            subtitle_style
        ))
        elements.append(HRFlowable(width="100%", thickness=2, color=aws_orange, spaceBefore=0, spaceAfter=12))

        # 2. Key Metrics Summary Grid (Cards)
        metrics = report_data["summary_metrics"]
        kpi_data = [
            [
                Paragraph("TOTAL AWS COST", kpi_label),
                Paragraph("CURRENT MONTH", kpi_label),
                Paragraph("MoM SPEND CHANGE", kpi_label),
                Paragraph("ACTIVE SERVICES", kpi_label)
            ],
            [
                Paragraph(f"<b>${metrics['total_cost']:,.2f}</b>", kpi_val),
                Paragraph(f"<b>${metrics['current_month_cost']:,.2f}</b>", kpi_val),
                Paragraph(f"<b>{metrics['cost_change_pct']:+.1f}%</b>", kpi_val),
                Paragraph(f"<b>{metrics['active_services_count']}</b>", kpi_val)
            ]
        ]
        kpi_table = Table(kpi_data, colWidths=[130, 130, 130, 130])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), aws_light_bg),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#D5DBDB")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#EAEDED")),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(kpi_table)
        elements.append(Spacer(1, 14))

        # 3. Service Breakdown Table
        elements.append(Paragraph("AWS Service Cost & Consumption Breakdown", section_heading))
        service_rows = [
            [
                Paragraph("<b>Service Name</b>", body_style),
                Paragraph("<b>Total Cost (USD)</b>", body_style),
                Paragraph("<b>Share %</b>", body_style),
                Paragraph("<b>Resources</b>", body_style),
                Paragraph("<b>Primary Region</b>", body_style)
            ]
        ]
        for s in report_data.get("service_breakdown", [])[:8]:
            service_rows.append([
                Paragraph(s.get("service", ""), body_style),
                Paragraph(f"${s.get('total_cost', 0):,.2f}", body_style),
                Paragraph(f"{s.get('percentage_contribution', 0):.1f}%", body_style),
                Paragraph(str(s.get("resource_count", 0)), body_style),
                Paragraph(s.get("primary_region", ""), body_style)
            ])

        svc_table = Table(service_rows, colWidths=[160, 95, 75, 70, 120])
        svc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), aws_dark),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, aws_light_bg]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D5DBDB")),
        ]))
        # Fix text colors for header row in ReportLab paragraphs:
        for i in range(5):
            service_rows[0][i].style.textColor = colors.white

        elements.append(svc_table)
        elements.append(Spacer(1, 14))

        # 4. Regional Spend Table
        elements.append(Paragraph("Regional Spend & Infrastructure Footprint", section_heading))
        reg_rows = [
            [
                Paragraph("<b>Region Code</b>", body_style),
                Paragraph("<b>Region Name</b>", body_style),
                Paragraph("<b>Total Spend (USD)</b>", body_style),
                Paragraph("<b>Share %</b>", body_style),
                Paragraph("<b>Active Services</b>", body_style)
            ]
        ]
        for r in report_data.get("region_breakdown", [])[:6]:
            reg_rows.append([
                Paragraph(r.get("region", ""), body_style),
                Paragraph(r.get("region_name", ""), body_style),
                Paragraph(f"${r.get('total_cost', 0):,.2f}", body_style),
                Paragraph(f"{r.get('percentage_share', 0):.1f}%", body_style),
                Paragraph(str(r.get("services_count", 0)), body_style)
            ])

        for i in range(5):
            reg_rows[0][i].style.textColor = colors.white

        reg_table = Table(reg_rows, colWidths=[90, 170, 95, 75, 90])
        reg_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), aws_dark),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, aws_light_bg]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D5DBDB")),
        ]))
        elements.append(reg_table)
        elements.append(Spacer(1, 14))

        # 5. Dynamic Optimization Recommendations
        insights = report_data.get("insights", [])
        if insights:
            elements.append(Paragraph("Automated Cloud Cost & Optimization Insights", section_heading))
            for ins in insights[:4]:
                impact_text = f" | Potential Savings: <b>${ins['impact_usd']:,.2f}</b>" if ins.get("impact_usd") else ""
                ins_p = Paragraph(
                    f"<b>[{ins.get('severity', 'INFO')}] {ins.get('title')}</b>{impact_text}<br/>"
                    f"<font color='#545B64'>{ins.get('description')}</font><br/>"
                    f"<b>Recommended Action:</b> {ins.get('action')}",
                    body_style
                )
                rec_box = Table([[ins_p]], colWidths=[520])
                rec_box.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), aws_light_bg),
                    ('BOX', (0, 0), (-1, -1), 1, aws_orange if ins.get('severity') == 'HIGH' else colors.HexColor("#0073BB")),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('LEFTPADDING', (0, 0), (-1, -1), 8),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ]))
                elements.append(rec_box)
                elements.append(Spacer(1, 6))

        # Footer
        elements.append(Spacer(1, 10))
        elements.append(Paragraph(
            "<i>Generated automatically by AWS Usage & Report Analysis Platform (FastAPI + Athena + S3). Confidential.</i>",
            kpi_label
        ))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

report_service = ReportService()
