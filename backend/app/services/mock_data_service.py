import os
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.config import settings
from app.models.schemas import (
    FilterParams, KpiMetrics, MonthlyCostItem, ServiceCostItem,
    RegionCostItem, DailyCostTrendItem, RecentActivityItem,
    DashboardResponse, CostAnalysisResponse, UsageAnalysisResponse,
    ServiceDetailItem
)
from app.utils.helpers import get_region_friendly_name, get_service_category
from app.services.insights_service import InsightsService

class MockDataService:
    def __init__(self):
        self._df: Optional[pd.DataFrame] = None
        self._load_data()

    def _load_data(self):
        csv_path = settings.get_resolved_sample_data_path()
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Sample data CSV not found at {csv_path}")
        
        self._df = pd.read_csv(csv_path)
        self._df["date"] = pd.to_datetime(self._df["date"])
        self._df["month"] = self._df["date"].dt.strftime("%Y-%m")
        self._df["date_str"] = self._df["date"].dt.strftime("%Y-%m-%d")

    def get_df(self) -> pd.DataFrame:
        if self._df is None:
            self._load_data()
        return self._df.copy()

    def apply_filters(self, df: pd.DataFrame, filters: Optional[FilterParams]) -> pd.DataFrame:
        if filters is None:
            return df

        if filters.start_date:
            try:
                start_dt = pd.to_datetime(filters.start_date)
                df = df[df["date"] >= start_dt]
            except Exception:
                pass

        if filters.end_date:
            try:
                end_dt = pd.to_datetime(filters.end_date)
                df = df[df["date"] <= end_dt]
            except Exception:
                pass

        if filters.services and len(filters.services) > 0:
            df = df[df["service"].isin(filters.services)]

        if filters.regions and len(filters.regions) > 0:
            df = df[df["region"].isin(filters.regions)]

        if filters.environments and len(filters.environments) > 0:
            df = df[df["tag_environment"].isin(filters.environments)]

        if filters.projects and len(filters.projects) > 0:
            df = df[df["tag_project"].isin(filters.projects)]

        return df

    def get_dashboard_data(self, filters: Optional[FilterParams] = None) -> DashboardResponse:
        df = self.apply_filters(self.get_df(), filters)

        if df.empty:
            empty_kpis = KpiMetrics(
                total_cost=0.0,
                current_month_cost=0.0,
                previous_month_cost=0.0,
                cost_change_percentage=0.0,
                total_usage=0.0,
                total_services_count=0,
                total_regions_count=0,
                total_resources_count=0,
                most_expensive_service="N/A",
                most_expensive_service_cost=0.0,
                highest_cost_region="N/A"
            )
            return DashboardResponse(
                kpis=empty_kpis,
                monthly_costs=[],
                service_costs=[],
                region_costs=[],
                daily_trend=[],
                recent_activity=[],
                insights=[],
                data_source="mock"
            )

        total_cost = round(float(df["cost"].sum()), 2)
        total_usage = round(float(df["usage_quantity"].sum()), 2)
        total_services_count = int(df["service"].nunique())
        total_regions_count = int(df["region"].nunique())
        total_resources_count = int(df["resource_id"].nunique())

        # Monthly aggregation
        monthly_df = df.groupby("month").agg(
            total_cost=("cost", "sum"),
            total_usage=("usage_quantity", "sum"),
            service_count=("service", "nunique")
        ).reset_index().sort_values("month")

        monthly_costs: List[MonthlyCostItem] = [
            MonthlyCostItem(
                month=row["month"],
                total_cost=round(float(row["total_cost"]), 2),
                total_usage=round(float(row["total_usage"]), 2),
                service_count=int(row["service_count"])
            )
            for _, row in monthly_df.iterrows()
        ]

        # Current vs Previous Month MoM
        if len(monthly_costs) >= 2:
            current_month_cost = monthly_costs[-1].total_cost
            prev_month_cost = monthly_costs[-2].total_cost
            mom_pct = round(((current_month_cost - prev_month_cost) / prev_month_cost * 100), 2) if prev_month_cost > 0 else 0.0
        elif len(monthly_costs) == 1:
            current_month_cost = monthly_costs[0].total_cost
            prev_month_cost = 0.0
            mom_pct = 0.0
        else:
            current_month_cost = 0.0
            prev_month_cost = 0.0
            mom_pct = 0.0

        # Service breakdown
        service_df = df.groupby("service").agg(
            total_cost=("cost", "sum"),
            resource_count=("resource_id", "nunique"),
            primary_region=("region", lambda x: x.mode()[0] if not x.empty else "us-east-1"),
            usage_quantity=("usage_quantity", "sum"),
            usage_unit=("usage_unit", lambda x: x.mode()[0] if not x.empty else "Units")
        ).reset_index().sort_values("total_cost", ascending=False)

        service_costs: List[ServiceCostItem] = []
        for _, row in service_df.iterrows():
            scost = round(float(row["total_cost"]), 2)
            pct = round((scost / total_cost * 100), 2) if total_cost > 0 else 0.0
            service_costs.append(ServiceCostItem(
                service=row["service"],
                total_cost=scost,
                percentage_contribution=pct,
                resource_count=int(row["resource_count"]),
                primary_region=get_region_friendly_name(str(row["primary_region"])),
                usage_quantity=round(float(row["usage_quantity"]), 2),
                usage_unit=str(row["usage_unit"])
            ))

        most_expensive_service = service_costs[0].service if service_costs else "N/A"
        most_expensive_service_cost = service_costs[0].total_cost if service_costs else 0.0

        # Region breakdown
        region_df = df.groupby("region").agg(
            total_cost=("cost", "sum"),
            services_count=("service", "nunique"),
            resources_count=("resource_id", "nunique")
        ).reset_index().sort_values("total_cost", ascending=False)

        region_costs: List[RegionCostItem] = []
        for _, row in region_df.iterrows():
            rcost = round(float(row["total_cost"]), 2)
            pct = round((rcost / total_cost * 100), 2) if total_cost > 0 else 0.0
            region_costs.append(RegionCostItem(
                region=row["region"],
                region_name=get_region_friendly_name(row["region"]),
                total_cost=rcost,
                percentage_share=pct,
                services_count=int(row["services_count"]),
                resources_count=int(row["resources_count"])
            ))

        highest_cost_region = region_costs[0].region_name if region_costs else "N/A"

        # Daily trend (last 30-60 points or filtered points)
        daily_df = df.groupby(["date_str", "service"])["cost"].sum().unstack(fill_value=0).reset_index()
        daily_trend: List[DailyCostTrendItem] = []
        
        # Take the most recent 60 days if large
        if len(daily_df) > 60:
            daily_df = daily_df.tail(60)

        for _, row in daily_df.iterrows():
            d_str = row["date_str"]
            breakdown = {col: round(float(row[col]), 2) for col in daily_df.columns if col != "date_str"}
            day_total = round(sum(breakdown.values()), 2)
            daily_trend.append(DailyCostTrendItem(
                date=d_str,
                total_cost=day_total,
                breakdown_by_service=breakdown
            ))

        # Recent activity (latest 10 records)
        recent_df = df.sort_values(by=["date", "cost"], ascending=[False, False]).head(10)
        recent_activity: List[RecentActivityItem] = [
            RecentActivityItem(
                date=row["date_str"],
                service=row["service"],
                region=row["region"],
                usage_type=row["usage_type"],
                usage_quantity=round(float(row["usage_quantity"]), 2),
                usage_unit=row["usage_unit"],
                cost=round(float(row["cost"]), 2),
                resource_id=row["resource_id"],
                tag_environment=row.get("tag_environment", "Production"),
                tag_project=row.get("tag_project", "Core")
            )
            for _, row in recent_df.iterrows()
        ]

        # Environment breakdown for recommendations
        env_df = df.groupby("tag_environment")["cost"].sum().reset_index()
        env_breakdown = [{"environment": r["tag_environment"], "total_cost": float(r["cost"])} for _, r in env_df.iterrows()]

        # Generate rule-based dynamic recommendations
        insights = InsightsService.generate_recommendations(
            total_cost=total_cost,
            service_costs=[s.model_dump() for s in service_costs],
            region_costs=[r.model_dump() for r in region_costs],
            monthly_costs=[m.model_dump() for m in monthly_costs],
            environment_breakdown=env_breakdown
        )

        kpis = KpiMetrics(
            total_cost=total_cost,
            current_month_cost=current_month_cost,
            previous_month_cost=prev_month_cost,
            cost_change_percentage=mom_pct,
            total_usage=total_usage,
            total_services_count=total_services_count,
            total_regions_count=total_regions_count,
            total_resources_count=total_resources_count,
            most_expensive_service=most_expensive_service,
            most_expensive_service_cost=most_expensive_service_cost,
            highest_cost_region=highest_cost_region
        )

        return DashboardResponse(
            kpis=kpis,
            monthly_costs=monthly_costs,
            service_costs=service_costs,
            region_costs=region_costs,
            daily_trend=daily_trend,
            recent_activity=recent_activity,
            insights=insights,
            data_source="mock"
        )

    def get_cost_analysis(self, filters: Optional[FilterParams] = None) -> CostAnalysisResponse:
        dash = self.get_dashboard_data(filters)
        df = self.apply_filters(self.get_df(), filters)

        # Environment breakdown
        env_df = df.groupby("tag_environment").agg(
            total_cost=("cost", "sum"),
            resource_count=("resource_id", "nunique")
        ).reset_index().sort_values("total_cost", ascending=False)
        
        env_breakdown = []
        for _, r in env_df.iterrows():
            ecost = round(float(r["total_cost"]), 2)
            pct = round((ecost / dash.kpis.total_cost * 100), 2) if dash.kpis.total_cost > 0 else 0.0
            env_breakdown.append({
                "environment": r["tag_environment"],
                "total_cost": ecost,
                "percentage": pct,
                "resource_count": int(r["resource_count"])
            })

        # Top individual resources
        res_df = df.groupby(["resource_id", "service", "region", "tag_environment", "tag_project"]).agg(
            total_cost=("cost", "sum"),
            usage_quantity=("usage_quantity", "sum"),
            usage_unit=("usage_unit", lambda x: x.iloc[0])
        ).reset_index().sort_values("total_cost", ascending=False).head(20)

        highest_cost_resources = [
            {
                "resource_id": r["resource_id"],
                "service": r["service"],
                "region": r["region"],
                "environment": r["tag_environment"],
                "project": r["tag_project"],
                "total_cost": round(float(r["total_cost"]), 2),
                "usage_quantity": round(float(r["usage_quantity"]), 2),
                "usage_unit": r["usage_unit"]
            }
            for _, r in res_df.iterrows()
        ]

        # Pareto Analysis (Cumulative Cost Share)
        pareto_list = []
        running_cost = 0.0
        for s in dash.service_costs:
            running_cost += s.total_cost
            cum_pct = round((running_cost / dash.kpis.total_cost * 100), 2) if dash.kpis.total_cost > 0 else 0.0
            pareto_list.append({
                "service": s.service,
                "cost": s.total_cost,
                "share_pct": s.percentage_contribution,
                "cumulative_pct": cum_pct
            })

        return CostAnalysisResponse(
            total_cost=dash.kpis.total_cost,
            service_breakdown=dash.service_costs,
            region_breakdown=dash.region_costs,
            environment_breakdown=env_breakdown,
            monthly_trend=dash.monthly_costs,
            daily_trend=dash.daily_trend,
            highest_cost_resources=highest_cost_resources,
            pareto_analysis=pareto_list,
            data_source="mock"
        )

    def get_usage_analysis(self, filters: Optional[FilterParams] = None) -> UsageAnalysisResponse:
        df = self.apply_filters(self.get_df(), filters)

        # Service usage
        service_usage_df = df.groupby(["service", "usage_unit"]).agg(
            total_quantity=("usage_quantity", "sum"),
            total_cost=("cost", "sum"),
            records_count=("date", "count")
        ).reset_index().sort_values("total_cost", ascending=False)

        service_usage = [
            {
                "service": r["service"],
                "usage_unit": r["usage_unit"],
                "total_quantity": round(float(r["total_quantity"]), 2),
                "total_cost": round(float(r["total_cost"]), 2),
                "records_count": int(r["records_count"])
            }
            for _, r in service_usage_df.iterrows()
        ]

        # Usage type breakdown
        type_df = df.groupby(["service", "usage_type", "usage_unit"]).agg(
            total_quantity=("usage_quantity", "sum"),
            total_cost=("cost", "sum")
        ).reset_index().sort_values("total_cost", ascending=False).head(20)

        usage_type_breakdown = [
            {
                "service": r["service"],
                "usage_type": r["usage_type"],
                "usage_unit": r["usage_unit"],
                "total_quantity": round(float(r["total_quantity"]), 2),
                "total_cost": round(float(r["total_cost"]), 2),
                "unit_rate": round(float(r["total_cost"]) / float(r["total_quantity"]), 4) if float(r["total_quantity"]) > 0 else 0.0
            }
            for _, r in type_df.iterrows()
        ]

        # Monthly usage trend by top services
        monthly_usage_df = df.groupby(["month", "service"]).agg(
            monthly_quantity=("usage_quantity", "sum"),
            monthly_cost=("cost", "sum")
        ).reset_index().sort_values("month")

        monthly_usage_trend = [
            {
                "month": r["month"],
                "service": r["service"],
                "usage_quantity": round(float(r["monthly_quantity"]), 2),
                "cost": round(float(r["monthly_cost"]), 2)
            }
            for _, r in monthly_usage_df.iterrows()
        ]

        # Regional usage
        reg_df = df.groupby(["region", "service"]).agg(
            usage_quantity=("usage_quantity", "sum"),
            cost=("cost", "sum")
        ).reset_index().sort_values("cost", ascending=False)

        regional_usage = [
            {
                "region": r["region"],
                "region_name": get_region_friendly_name(r["region"]),
                "service": r["service"],
                "usage_quantity": round(float(r["usage_quantity"]), 2),
                "cost": round(float(r["cost"]), 2)
            }
            for _, r in reg_df.iterrows()
        ]

        # Top resource consumers
        res_consumers = df.groupby(["resource_id", "service", "region"]).agg(
            total_usage=("usage_quantity", "sum"),
            total_cost=("cost", "sum"),
            usage_unit=("usage_unit", lambda x: x.iloc[0])
        ).reset_index().sort_values("total_usage", ascending=False).head(15)

        top_resource_consumers = [
            {
                "resource_id": r["resource_id"],
                "service": r["service"],
                "region": r["region"],
                "total_usage": round(float(r["total_usage"]), 2),
                "total_cost": round(float(r["total_cost"]), 2),
                "usage_unit": r["usage_unit"]
            }
            for _, r in res_consumers.iterrows()
        ]

        return UsageAnalysisResponse(
            total_usage_records=len(df),
            service_usage=service_usage,
            usage_type_breakdown=usage_type_breakdown,
            monthly_usage_trend=monthly_usage_trend,
            regional_usage=regional_usage,
            top_resource_consumers=top_resource_consumers,
            data_source="mock"
        )

    def get_services_summary(self, filters: Optional[FilterParams] = None) -> List[ServiceDetailItem]:
        df = self.apply_filters(self.get_df(), filters)
        if df.empty:
            return []

        total_cost = df["cost"].sum()
        results: List[ServiceDetailItem] = []

        for service_name, s_group in df.groupby("service"):
            scost = round(float(s_group["cost"].sum()), 2)
            susage = round(float(s_group["usage_quantity"].sum()), 2)
            sunit = s_group["usage_unit"].mode()[0] if not s_group.empty else "Units"
            pregion = get_region_friendly_name(str(s_group["region"].mode()[0]))
            res_cnt = int(s_group["resource_id"].nunique())
            top_utype = str(s_group.groupby("usage_type")["cost"].sum().idxmax())
            cost_share = round((scost / total_cost * 100), 2) if total_cost > 0 else 0.0

            # MoM change for this service
            months = sorted(s_group["month"].unique())
            if len(months) >= 2:
                cur_m = s_group[s_group["month"] == months[-1]]["cost"].sum()
                prev_m = s_group[s_group["month"] == months[-2]]["cost"].sum()
                pct_chg = round(((cur_m - prev_m) / prev_m * 100), 2) if prev_m > 0 else 0.0
            else:
                pct_chg = 0.0

            results.append(ServiceDetailItem(
                service=str(service_name),
                category=get_service_category(str(service_name)),
                total_cost=scost,
                total_usage=susage,
                usage_unit=sunit,
                primary_region=pregion,
                resource_count=res_cnt,
                cost_change_percentage=pct_chg,
                top_usage_type=top_utype,
                cost_share_pct=cost_share
            ))

        return sorted(results, key=lambda x: x.total_cost, reverse=True)

    def get_regions_summary(self, filters: Optional[FilterParams] = None) -> List[RegionCostItem]:
        dash = self.get_dashboard_data(filters)
        return dash.region_costs

mock_data_service = MockDataService()
