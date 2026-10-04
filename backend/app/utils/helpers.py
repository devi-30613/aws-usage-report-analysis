from typing import Dict

REGION_NAME_MAP: Dict[str, str] = {
    "us-east-1": "US East (N. Virginia)",
    "us-west-2": "US West (Oregon)",
    "eu-west-1": "Europe (Ireland)",
    "ap-south-1": "Asia Pacific (Mumbai)",
    "ap-southeast-1": "Asia Pacific (Singapore)",
    "eu-central-1": "Europe (Frankfurt)",
    "us-east-2": "US East (Ohio)",
    "us-west-1": "US West (N. California)",
    "sa-east-1": "South America (São Paulo)",
    "ap-northeast-1": "Asia Pacific (Tokyo)"
}

SERVICE_CATEGORY_MAP: Dict[str, str] = {
    "Amazon EC2": "Compute",
    "Amazon S3": "Storage",
    "Amazon RDS": "Database",
    "AWS Lambda": "Serverless Compute",
    "Amazon DynamoDB": "NoSQL Database",
    "Amazon CloudFront": "Networking & CDN",
    "Amazon CloudWatch": "Management & Governance",
    "Amazon ECS": "Containers",
    "AWS Athena": "Analytics",
    "Amazon SNS/SQS": "Application Integration"
}

def get_region_friendly_name(region_code: str) -> str:
    return REGION_NAME_MAP.get(region_code, region_code)

def get_service_category(service_name: str) -> str:
    return SERVICE_CATEGORY_MAP.get(service_name, "Other AWS Services")
