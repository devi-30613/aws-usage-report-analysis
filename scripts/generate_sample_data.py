import csv
import random
from datetime import datetime, timedelta

# Seed for reproducible realistic data
random.seed(42)

services = {
    "Amazon EC2": {
        "usage_types": [
            ("BoxUsage:t3.medium", "Hrs", 0.0416, 1.0),
            ("BoxUsage:t3.large", "Hrs", 0.0832, 1.0),
            ("BoxUsage:m5.xlarge", "Hrs", 0.192, 1.0),
            ("BoxUsage:c5.2xlarge", "Hrs", 0.34, 1.0),
            ("EBS:VolumeUsage.gp3", "GB-Mo", 0.08, 0.03),
            ("DataTransfer-Out-Bytes", "GB", 0.09, 0.5)
        ],
        "resource_prefix": "i-"
    },
    "Amazon S3": {
        "usage_types": [
            ("TimedStorage-ByteHrs", "GB-Mo", 0.023, 10.0),
            ("Requests-Tier1", "Count-1000s", 0.005, 50.0),
            ("Requests-Tier2", "Count-1000s", 0.0004, 200.0),
            ("DataTransfer-Out-Bytes", "GB", 0.09, 2.0)
        ],
        "resource_prefix": "arn:aws:s3:::"
    },
    "Amazon RDS": {
        "usage_types": [
            ("InstanceUsage:db.t3.medium", "Hrs", 0.068, 1.0),
            ("InstanceUsage:db.r5.large", "Hrs", 0.24, 1.0),
            ("RDS:GP3-Storage", "GB-Mo", 0.115, 0.5),
            ("RDS:BackupUsage", "GB-Mo", 0.095, 0.2)
        ],
        "resource_prefix": "db-"
    },
    "AWS Lambda": {
        "usage_types": [
            ("Lambda-GB-Second", "GB-s", 0.0000166667, 50000.0),
            ("Request", "Count-Millions", 0.20, 0.8),
            ("Provisioned-Concurrency", "GB-s", 0.0000041667, 10000.0)
        ],
        "resource_prefix": "arn:aws:lambda:function:"
    },
    "Amazon DynamoDB": {
        "usage_types": [
            ("ReadCapacityUnit-Hrs", "RCU-Mo", 0.00013, 200.0),
            ("WriteCapacityUnit-Hrs", "WCU-Mo", 0.00065, 100.0),
            ("TimedStorage-ByteHrs", "GB-Mo", 0.25, 0.2)
        ],
        "resource_prefix": "table/"
    },
    "Amazon CloudFront": {
        "usage_types": [
            ("DataTransfer-Out-Bytes", "GB", 0.085, 5.0),
            ("Requests-Tier1", "Count-10000s", 0.0075, 40.0)
        ],
        "resource_prefix": "distribution/"
    },
    "Amazon CloudWatch": {
        "usage_types": [
            ("MetricMonitorUsage", "Metrics", 0.30, 0.2),
            ("DataScanned-Bytes", "GB", 0.005, 15.0),
            ("PutLogEvents", "GB", 0.50, 0.1)
        ],
        "resource_prefix": "log-group:"
    },
    "Amazon ECS": {
        "usage_types": [
            ("Fargate-vCPU-Hours", "vCPU-Hrs", 0.04048, 2.0),
            ("Fargate-GB-Hours", "GB-Hrs", 0.004445, 8.0)
        ],
        "resource_prefix": "task/"
    },
    "AWS Athena": {
        "usage_types": [
            ("DataScanned-Bytes", "TB", 5.00, 0.005)
        ],
        "resource_prefix": "workgroup/"
    },
    "Amazon SNS/SQS": {
        "usage_types": [
            ("Requests", "Count-Millions", 0.40, 0.5),
            ("Payload-Delivery", "GB", 0.09, 0.1)
        ],
        "resource_prefix": "queue/"
    }
}

regions = [
    ("us-east-1", 0.40),
    ("us-west-2", 0.25),
    ("eu-west-1", 0.15),
    ("ap-south-1", 0.10),
    ("ap-southeast-1", 0.05),
    ("eu-central-1", 0.05)
]

projects = ["E-Commerce-Core", "Data-Pipeline", "Customer-Portal", "ML-Inference", "Auth-Service"]
environments = ["Production", "Staging", "Development"]
account_id = "123456789012"

start_date = datetime(2025, 10, 1)
end_date = datetime(2026, 10, 1)

rows = []
current_date = start_date

while current_date <= end_date:
    date_str = current_date.strftime("%Y-%m-%d")
    month_factor = 1.0 + (current_date.month % 4) * 0.05 + (current_date.year - 2025) * 0.12
    
    # Generate daily records for each service
    for service_name, s_info in services.items():
        # Pick 1-3 usage types per day for this service
        for usage_type, unit, unit_price, base_qty in s_info["usage_types"]:
            # Pick a region weighted
            region = random.choices([r[0] for r in regions], weights=[r[1] for r in regions])[0]
            
            # Fluctuation
            daily_variation = random.uniform(0.75, 1.35)
            # Weekend drop for dev/staging
            is_weekend = current_date.weekday() >= 5
            if is_weekend:
                daily_variation *= 0.85
                
            qty = round(base_qty * month_factor * daily_variation * random.uniform(10, 30), 4)
            cost = round(qty * unit_price, 4)
            
            if cost < 0.01:
                cost = round(random.uniform(0.01, 0.08), 4)
                
            res_id = f"{s_info['resource_prefix']}{random.randint(1000, 9999)}"
            project = random.choice(projects)
            env = random.choices(environments, weights=[0.6, 0.25, 0.15])[0]
            
            rows.append({
                "date": date_str,
                "service": service_name,
                "region": region,
                "usage_type": usage_type,
                "usage_quantity": qty,
                "usage_unit": unit,
                "cost": cost,
                "currency": "USD",
                "resource_id": res_id,
                "account_id": account_id,
                "tag_environment": env,
                "tag_project": project
            })
            
    current_date += timedelta(days=1)

output_file = "data/sample_aws_usage.csv"
fieldnames = [
    "date", "service", "region", "usage_type", "usage_quantity",
    "usage_unit", "cost", "currency", "resource_id", "account_id",
    "tag_environment", "tag_project"
]

import os
os.makedirs("data", exist_ok=True)

with open(output_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"Generated {len(rows)} sample AWS usage records in {output_file}")
