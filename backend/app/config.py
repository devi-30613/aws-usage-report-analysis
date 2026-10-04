import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field, AliasChoices

class Settings(BaseSettings):
    # Application Mode: 'mock' or 'aws'
    data_source: str = Field(default="mock", validation_alias=AliasChoices("DATA_SOURCE", "data_source"))
    
    # Server details
    host: str = Field(default="0.0.0.0", validation_alias=AliasChoices("HOST", "host"))
    port: int = Field(default=8000, validation_alias=AliasChoices("PORT", "port"))
    environment: str = Field(default="development", validation_alias=AliasChoices("ENVIRONMENT", "environment"))
    
    # CORS
    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:8000",
        validation_alias=AliasChoices("CORS_ORIGINS", "cors_origins")
    )
    
    # Cache
    cache_ttl_seconds: int = Field(default=300, validation_alias=AliasChoices("CACHE_TTL_SECONDS", "cache_ttl_seconds"))
    
    # AWS Settings
    aws_region: str = Field(default="us-east-1", validation_alias=AliasChoices("AWS_REGION", "AWS_DEFAULT_REGION", "aws_region"))
    aws_access_key_id: str = Field(default="", validation_alias=AliasChoices("AWS_ACCESS_KEY_ID", "aws_access_key_id"))
    aws_secret_access_key: str = Field(default="", validation_alias=AliasChoices("AWS_SECRET_ACCESS_KEY", "aws_secret_access_key"))
    aws_session_token: str = Field(default="", validation_alias=AliasChoices("AWS_SESSION_TOKEN", "aws_session_token"))
    
    # Athena Settings
    athena_database: str = Field(default="aws_usage_db", validation_alias=AliasChoices("ATHENA_DATABASE", "athena_database"))
    athena_table: str = Field(default="aws_usage_reports", validation_alias=AliasChoices("ATHENA_TABLE", "athena_table"))
    athena_workgroup: str = Field(default="primary", validation_alias=AliasChoices("ATHENA_WORKGROUP", "athena_workgroup"))
    athena_output_location: str = Field(default="s3://aws-usage-reports-sample-bucket/athena-results/", validation_alias=AliasChoices("ATHENA_OUTPUT_LOCATION", "athena_output_location"))
    
    # S3 Settings
    s3_bucket: str = Field(default="aws-usage-reports-sample-bucket", validation_alias=AliasChoices("S3_BUCKET", "S3_BUCKET_NAME", "s3_bucket"))
    s3_prefix: str = Field(default="raw-usage-data/", validation_alias=AliasChoices("S3_PREFIX", "s3_prefix"))
    s3_report_prefix: str = Field(default="generated-reports/", validation_alias=AliasChoices("S3_REPORT_PREFIX", "s3_report_prefix"))

    # Sample Data Path
    sample_data_path: str = Field(
        default=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "sample_aws_usage.csv")
    )

    @property
    def cors_origin_list(self) -> List[str]:
        origins = []
        for origin in self.cors_origins.split(","):
            cleaned = origin.strip().rstrip("/")
            if cleaned:
                origins.append(cleaned)
        return origins if origins else ["*"]

    def get_resolved_sample_data_path(self) -> str:
        """Finds the sample CSV file across multiple potential runtime locations."""
        candidates = [
            self.sample_data_path,
            os.path.join(os.getcwd(), "data", "sample_aws_usage.csv"),
            os.path.join(os.getcwd(), "..", "data", "sample_aws_usage.csv"),
            os.path.join("/app", "data", "sample_aws_usage.csv"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "sample_aws_usage.csv"),
        ]
        for path in candidates:
            if path and os.path.exists(path):
                return path
        return self.sample_data_path

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
