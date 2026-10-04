from typing import List, Dict, Any
from app.models.schemas import RecommendationItem

class InsightsService:
    @staticmethod
    def generate_recommendations(
        total_cost: float,
        service_costs: List[Dict[str, Any]],
        region_costs: List[Dict[str, Any]],
        monthly_costs: List[Dict[str, Any]],
        environment_breakdown: List[Dict[str, Any]] = None
    ) -> List[RecommendationItem]:
        recommendations: List[RecommendationItem] = []
        if total_cost <= 0 or not service_costs:
            return recommendations

        # 1. Top Cost Driver Analysis
        top_service = service_costs[0]
        top_service_name = top_service.get("service", "Unknown")
        top_service_cost = top_service.get("total_cost", 0.0)
        top_service_share = top_service.get("percentage_contribution", 0.0)

        if top_service_share >= 30.0:
            potential_savings = round(top_service_cost * 0.28, 2)
            if "EC2" in top_service_name or "Compute" in top_service_name:
                recommendations.append(RecommendationItem(
                    id="rec-compute-sp-01",
                    title=f"Adopt AWS Compute Savings Plans for {top_service_name}",
                    category="Cost Optimization",
                    severity="HIGH",
                    impact_usd=potential_savings,
                    description=f"{top_service_name} accounts for {top_service_share:.1f}% (${top_service_cost:,.2f}) of your total AWS expenditure. Committing to a 1-year or 3-year Compute Savings Plan can yield up to 28% savings.",
                    action="Review EC2 / Compute utilization in AWS Cost Explorer and purchase a 1-Year No-Upfront Savings Plan."
                ))
            elif "RDS" in top_service_name or "Database" in top_service_name:
                recommendations.append(RecommendationItem(
                    id="rec-db-ri-01",
                    title=f"Reserved Instances for {top_service_name}",
                    category="Cost Optimization",
                    severity="HIGH",
                    impact_usd=potential_savings,
                    description=f"Database workloads on {top_service_name} represent {top_service_share:.1f}% of your budget. Converting steady-state instances to Reserved Instances will reduce costs.",
                    action="Evaluate database CPU and connection baselines and purchase RDS Reserved Instances for production nodes."
                ))
            else:
                recommendations.append(RecommendationItem(
                    id="rec-top-spend-01",
                    title=f"Cost Driver Concentration in {top_service_name}",
                    category="Cost Optimization",
                    severity="MEDIUM",
                    impact_usd=potential_savings,
                    description=f"{top_service_name} accounts for {top_service_share:.1f}% (${top_service_cost:,.2f}) of total spend.",
                    action=f"Audit {top_service_name} resource allocation and delete unattached storage volumes or unused provisioned capacity."
                ))

        # 2. Month-over-Month Cost Surge Detection
        if len(monthly_costs) >= 2:
            current_mo = monthly_costs[-1]
            prev_mo = monthly_costs[-2]
            cur_spend = current_mo.get("total_cost", 0.0)
            prev_spend = prev_mo.get("total_cost", 0.0)

            if prev_spend > 0:
                mom_change = ((cur_spend - prev_spend) / prev_spend) * 100
                if mom_change > 12.0:
                    spike_amount = round(cur_spend - prev_spend, 2)
                    recommendations.append(RecommendationItem(
                        id="rec-mom-spike-02",
                        title=f"Monthly Spend Spike Detected (+{mom_change:.1f}%)",
                        category="Anomaly Detection",
                        severity="HIGH",
                        impact_usd=spike_amount,
                        description=f"Monthly cloud spend increased by {mom_change:.1f}% (an additional ${spike_amount:,.2f}) from {prev_mo.get('month')} to {current_mo.get('month')}.",
                        action="Investigate new resource provisioning, unbudgeted scale-outs, or increased data transfer outbound in AWS Cost Anomaly Detection."
                    ))
                elif mom_change < -5.0:
                    recommendations.append(RecommendationItem(
                        id="rec-mom-reduction-02",
                        title=f"Spending Decreased by {abs(mom_change):.1f}% MoM",
                        category="Optimization Tracking",
                        severity="INFO",
                        impact_usd=None,
                        description=f"Great progress: your AWS billing decreased by {abs(mom_change):.1f}% compared with the prior billing cycle.",
                        action="Verify that reduced spend reflects intended architecture optimizations and not unexpected service downtime."
                    ))

        # 3. Regional Concentration Insight
        if region_costs:
            top_region = region_costs[0]
            region_name = top_region.get("region_name", top_region.get("region", "Primary Region"))
            region_pct = top_region.get("percentage_share", 0.0)
            region_cost = top_region.get("total_cost", 0.0)
            if region_pct > 35.0:
                recommendations.append(RecommendationItem(
                    id="rec-reg-concentrate-03",
                    title=f"Primary Deployment Concentration in {region_name}",
                    category="Governance & Resiliency",
                    severity="LOW",
                    impact_usd=None,
                    description=f"{region_name} represents {region_pct:.1f}% (${region_cost:,.2f}) of infrastructure footprint. Ensure cross-region disaster recovery readiness.",
                    action="Configure automated cross-region S3 replication and multi-region database read-replicas for mission-critical services."
                ))

        # 4. S3 Lifecycle & Storage Tiering Rule
        s3_item = next((s for s in service_costs if "S3" in s.get("service", "")), None)
        if s3_item and s3_item.get("total_cost", 0) > 100.0:
            s3_cost = s3_item.get("total_cost", 0)
            s3_savings = round(s3_cost * 0.35, 2)
            recommendations.append(RecommendationItem(
                id="rec-s3-tiering-04",
                title="Enable S3 Intelligent-Tiering & Lifecycle Expirations",
                category="Storage Optimization",
                severity="MEDIUM",
                impact_usd=s3_savings,
                description=f"Amazon S3 expenditures total ${s3_cost:,.2f}. Unaccessed historical objects and non-current object versions accumulate significant Standard storage costs.",
                action="Apply S3 Lifecycle policies to transition objects older than 30 days to Intelligent-Tiering or Glacier Flexible Retrieval, and expire multipart uploads."
            ))

        # 5. Non-Production Workload Optimization
        if environment_breakdown:
            dev_staging = [e for e in environment_breakdown if e.get("environment") in ["Development", "Staging"]]
            dev_cost = sum(e.get("total_cost", 0) for e in dev_staging)
            if dev_cost > 0 and (dev_cost / total_cost) > 0.25:
                dev_savings = round(dev_cost * 0.40, 2)
                recommendations.append(RecommendationItem(
                    id="rec-env-schedule-05",
                    title="Implement AWS Instance Scheduler for Non-Production Environments",
                    category="Resource Sizing",
                    severity="MEDIUM",
                    impact_usd=dev_savings,
                    description=f"Development and Staging environments represent ${(dev_cost / total_cost * 100):.1f}% (${dev_cost:,.2f}) of spend. Running dev instances 24/7 incurs unnecessary off-hours charges.",
                    action="Deploy AWS Instance Scheduler to automatically stop Dev/Staging EC2 and RDS instances on nights and weekends (saving up to 40%)."
                ))

        # 6. Athena & CloudWatch Log Retention Optimization
        cw_item = next((s for s in service_costs if "CloudWatch" in s.get("service", "") or "Athena" in s.get("service", "")), None)
        if cw_item:
            recommendations.append(RecommendationItem(
                id="rec-observability-06",
                title="Optimize CloudWatch Log Retention & Athena Data Partitioning",
                category="Management & Governance",
                severity="LOW",
                impact_usd=round(cw_item.get("total_cost", 0) * 0.25, 2),
                description="Default CloudWatch log groups store data 'Never Expire'. High ingestion volumes without partition filters also increase Athena query costs.",
                action="Set 30-day retention policies on non-audit log groups and convert Athena query target datasets to partitioned Parquet."
            ))

        return recommendations
