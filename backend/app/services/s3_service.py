import io
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import boto3
from botocore.exceptions import ClientError, BotoCoreError
from app.config import settings

logger = logging.getLogger("s3_service")

class S3Service:
    def __init__(self):
        self._client = None

    def get_client(self):
        if self._client is None:
            session_kwargs = {
                "region_name": settings.aws_region
            }
            if settings.aws_access_key_id and settings.aws_secret_access_key:
                session_kwargs["aws_access_key_id"] = settings.aws_access_key_id
                session_kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
                if settings.aws_session_token:
                    session_kwargs["aws_session_token"] = settings.aws_session_token
            self._client = boto3.client("s3", **session_kwargs)
        return self._client

    def check_bucket_status(self) -> Dict[str, Any]:
        """Checks if the configured S3 bucket exists and is accessible."""
        try:
            client = self.get_client()
            client.head_bucket(Bucket=settings.s3_bucket)
            
            # List objects under prefix to get metadata
            metadata = self.get_data_metadata()
            return {
                "status": "AVAILABLE",
                "bucket": settings.s3_bucket,
                "region": settings.aws_region,
                "data_prefix": settings.s3_prefix,
                "file_count": metadata.get("file_count", 0),
                "total_size_bytes": metadata.get("total_size_bytes", 0),
                "latest_modified": metadata.get("latest_modified", "N/A")
            }
        except Exception as e:
            logger.warning(f"S3 bucket check failed: {str(e)}")
            return {
                "status": "UNAVAILABLE",
                "bucket": settings.s3_bucket,
                "region": settings.aws_region,
                "error": str(e),
                "file_count": 0,
                "total_size_bytes": 0,
                "latest_modified": "N/A"
            }

    def get_data_metadata(self) -> Dict[str, Any]:
        """Scans the S3 prefix for data files and computes counts and timestamps."""
        try:
            client = self.get_client()
            paginator = client.get_paginator("list_objects_v2")
            pages = paginator.paginate(Bucket=settings.s3_bucket, Prefix=settings.s3_prefix)

            file_count = 0
            total_size = 0
            latest_time = None

            for page in pages:
                contents = page.get("Contents", [])
                file_count += len(contents)
                for obj in contents:
                    total_size += obj.get("Size", 0)
                    last_mod = obj.get("LastModified")
                    if latest_time is None or (last_mod and last_mod > latest_time):
                        latest_time = last_mod

            return {
                "file_count": file_count,
                "total_size_bytes": total_size,
                "latest_modified": latest_time.strftime("%Y-%m-%d %H:%M:%S UTC") if latest_time else "N/A"
            }
        except Exception as e:
            logger.warning(f"Error listing S3 objects: {str(e)}")
            return {
                "file_count": 0,
                "total_size_bytes": 0,
                "latest_modified": "N/A"
            }

    def upload_report(self, file_content: bytes, filename: str, content_type: str = "application/pdf") -> Optional[str]:
        """Uploads a generated report to the S3 bucket under the reports prefix."""
        try:
            client = self.get_client()
            key = f"{settings.s3_report_prefix.rstrip('/')}/{filename}"
            client.put_object(
                Bucket=settings.s3_bucket,
                Key=key,
                Body=file_content,
                ContentType=content_type
            )
            s3_uri = f"s3://{settings.s3_bucket}/{key}"
            logger.info(f"Report uploaded successfully to {s3_uri}")
            return s3_uri
        except Exception as e:
            logger.error(f"Failed to upload report to S3: {str(e)}")
            return None

s3_service = S3Service()
