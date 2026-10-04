import time
import os
import boto3
from botocore.exceptions import ClientError, BotoCoreError, NoCredentialsError
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional

from app.config import settings
from app.models.schemas import AwsStatusResponse
from app.services.cache_service import cache_service
from app.services.s3_service import s3_service
from app.services.athena_service import athena_service
from app.services.mock_data_service import mock_data_service

router = APIRouter(prefix="/aws", tags=["AWS Integration"])

class TestConnectionRequest(BaseModel):
    # Support both region and aws_region
    region: Optional[str] = Field(default=None, description="AWS Region (e.g. us-east-1, ap-south-1)")
    aws_region: Optional[str] = Field(default=None, description="Alternative field for region")
    
    # Support both access_key_id and aws_access_key_id
    access_key_id: Optional[str] = Field(default=None, description="AWS Access Key ID")
    aws_access_key_id: Optional[str] = Field(default=None, description="Alternative field for access key")
    
    # Support both secret_access_key and aws_secret_access_key
    secret_access_key: Optional[str] = Field(default=None, description="AWS Secret Access Key")
    aws_secret_access_key: Optional[str] = Field(default=None, description="Alternative field for secret key")
    
    # Optional Session Token
    session_token: Optional[str] = Field(default=None, description="Optional AWS Session Token (for SSO/Academy)")
    aws_session_token: Optional[str] = Field(default=None, description="Alternative field for session token")
    
    # Optional S3 & Athena overrides
    s3_bucket: Optional[str] = Field(default=None, description="S3 Data Bucket Name")
    athena_database: Optional[str] = Field(default="aws_usage_db", description="Athena Database Name")
    athena_table: Optional[str] = Field(default="aws_usage_reports", description="Athena Table Name")
    athena_output_location: Optional[str] = Field(default=None, description="Athena Query Result S3 location")

    def get_region(self) -> str:
        return self.region or self.aws_region or settings.aws_region or "us-east-1"

    def get_access_key(self) -> str:
        return (self.access_key_id or self.aws_access_key_id or "").strip()

    def get_secret_key(self) -> str:
        return (self.secret_access_key or self.aws_secret_access_key or "").strip()

    def get_session_token(self) -> Optional[str]:
        token = (self.session_token or self.aws_session_token or "").strip()
        return token if token else None

@router.post("/test-connection", summary="Test AWS Credentials & STS Identity")
async def test_aws_connection(req: TestConnectionRequest = Body(...)):
    """
    Securely validates AWS IAM credentials against AWS STS without exposing secret keys.
    Tests reachability of STS, S3 bucket, and Athena query engine.
    """
    start_t = time.time()
    
    region = req.get_region()
    access_key = req.get_access_key()
    secret_key = req.get_secret_key()
    session_token = req.get_session_token()

    if not access_key or not secret_key:
        raise HTTPException(
            status_code=400,
            detail="Missing credentials: Both access_key_id and secret_access_key are required."
        )

    session_kwargs = {
        "region_name": region,
        "aws_access_key_id": access_key,
        "aws_secret_access_key": secret_key,
    }
    if session_token:
        session_kwargs["aws_session_token"] = session_token

    try:
        session = boto3.Session(**session_kwargs)
        sts = session.client("sts")
        identity = sts.get_caller_identity()
        account_id = identity.get("Account")
        user_arn = identity.get("Arn")

        # Test S3 bucket if specified
        bucket_status = "NOT_SPECIFIED"
        if req.s3_bucket:
            s3_client = session.client("s3")
            try:
                s3_client.head_bucket(Bucket=req.s3_bucket)
                bucket_status = "ACCESSIBLE"
            except ClientError as e:
                err_code = e.response.get("Error", {}).get("Code", "Unknown")
                bucket_status = f"INACCESSIBLE ({err_code})"
            except Exception as e:
                bucket_status = f"INACCESSIBLE ({str(e)})"

        # Test Athena if specified
        athena_status = "AVAILABLE"
        try:
            athena_client = session.client("athena")
            athena_client.get_work_group(WorkGroup=settings.athena_workgroup or "primary")
        except Exception as e:
            athena_status = f"NOTICE: {str(e)}"

        latency = round((time.time() - start_t) * 1000, 2)

        return {
            "success": True,
            "message": "AWS credentials are valid",
            "region": region,
            "account_id": account_id,
            "user_arn": user_arn,
            "s3_bucket_status": bucket_status,
            "athena_status": athena_status,
            "latency_ms": latency
        }
    except (ClientError, BotoCoreError) as e:
        error_msg = str(e)
        if "InvalidClientTokenId" in error_msg:
            detail = "The security token / Access Key ID included in the request is invalid."
        elif "SignatureDoesNotMatch" in error_msg:
            detail = "The request signature we calculated does not match the signature you provided. Check your Secret Access Key."
        elif "ExpiredToken" in error_msg:
            detail = "The security token / session token has expired."
        else:
            detail = f"AWS Authentication Failed: {error_msg}"
        raise HTTPException(status_code=400, detail=detail)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to connect to AWS: {str(e)}")

@router.get("/status", response_model=AwsStatusResponse, summary="Get AWS Infrastructure & Connection Status")
async def get_aws_status():
    """Returns real-time status of S3, Athena, dataset counts, and cache performance."""
    start_t = time.time()
    
    if settings.data_source.lower() == "aws":
        s3_stat = s3_service.check_bucket_status()
        athena_stat = athena_service.check_connection()
        is_connected = s3_stat.get("status") == "AVAILABLE" and athena_stat.get("connected", False)
        s3_status_str = s3_stat.get("status", "UNAVAILABLE")
        latest_upload = s3_stat.get("latest_modified", "N/A")
        total_records = s3_stat.get("file_count", 0) * 1000 # estimated
        athena_status = "ONLINE" if athena_stat.get("connected") else "OFFLINE"
    else:
        # Mock mode status
        df = mock_data_service.get_df()
        is_connected = True
        s3_status_str = "AVAILABLE (Local Emulated)"
        latest_upload = df["date_str"].max() if not df.empty else "N/A"
        total_records = len(df)
        athena_status = "READY (Query Engine Emulated)"

    exec_time = round((time.time() - start_t) * 1000, 2)
    cache_info = cache_service.stats()

    return AwsStatusResponse(
        data_source=settings.data_source,
        is_aws_connected=is_connected,
        aws_region=settings.aws_region,
        athena_database=settings.athena_database,
        athena_table=settings.athena_table,
        athena_workgroup=settings.athena_workgroup,
        athena_output_bucket=settings.athena_output_location,
        s3_bucket=settings.s3_bucket,
        s3_status=s3_status_str,
        latest_data_upload=str(latest_upload),
        total_records_count=total_records,
        athena_query_status=athena_status,
        last_query_execution_time_ms=exec_time,
        cache_hit_rate_pct=cache_info.get("hit_rate_pct", 0.0),
        cached_queries_count=cache_info.get("cached_entries", 0)
    )

@router.post("/save-config", summary="Save AWS Configuration & Switch Engine")
async def save_aws_config(config: TestConnectionRequest = Body(...)):
    """Saves AWS credentials to backend .env, updates runtime settings, and sets DATA_SOURCE=aws."""
    try:
        region = config.get_region()
        access_key = config.get_access_key()
        secret_key = config.get_secret_key()
        session_token = config.get_session_token()

        if not access_key or not secret_key:
            raise HTTPException(status_code=400, detail="Both access_key_id and secret_access_key are required.")

        settings.aws_region = region
        settings.aws_access_key_id = access_key
        settings.aws_secret_access_key = secret_key
        settings.aws_session_token = session_token or ""
        
        if config.s3_bucket:
            settings.s3_bucket = config.s3_bucket
        if config.athena_database:
            settings.athena_database = config.athena_database
        if config.athena_table:
            settings.athena_table = config.athena_table
        if config.athena_output_location:
            settings.athena_output_location = config.athena_output_location

        settings.data_source = "aws"

        # Update .env file on disk
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            
            updates = {
                "DATA_SOURCE": "aws",
                "AWS_REGION": region,
                "AWS_ACCESS_KEY_ID": access_key,
                "AWS_SECRET_ACCESS_KEY": secret_key,
                "ATHENA_DATABASE": config.athena_database or settings.athena_database,
                "ATHENA_TABLE": config.athena_table or settings.athena_table,
                "S3_BUCKET": config.s3_bucket or settings.s3_bucket
            }
            if session_token:
                updates["AWS_SESSION_TOKEN"] = session_token
            if config.athena_output_location:
                updates["ATHENA_OUTPUT_LOCATION"] = config.athena_output_location

            new_lines = []
            updated = set()
            for line in lines:
                if "=" in line and not line.strip().startswith("#"):
                    k = line.split("=")[0].strip()
                    if k in updates:
                        new_lines.append(f"{k}={updates[k]}\n")
                        updated.add(k)
                        continue
                new_lines.append(line)
            
            for k, v in updates.items():
                if k not in updated:
                    new_lines.append(f"{k}={v}\n")

            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)

        cache_service.clear()
        # Reset boto3 client instances so they pick up new creds
        athena_service._client = None
        s3_service._client = None

        return {
            "success": True,
            "message": "AWS credentials saved successfully and platform switched to Live AWS Mode!",
            "data_source": "aws",
            "region": region
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save AWS configuration: {str(e)}")

@router.post("/mode", summary="Switch Data Source Mode (mock vs aws)")
async def switch_mode(mode: str = Body(..., embed=True)):
    """Switches backend between 'mock' and 'aws' data source modes."""
    if mode.lower() not in ["mock", "aws"]:
        raise HTTPException(status_code=400, detail="Mode must be either 'mock' or 'aws'")
    settings.data_source = mode.lower()
    cache_service.clear()
    return {"message": f"Data source switched to {settings.data_source}", "data_source": settings.data_source}

@router.post("/cache/clear", summary="Clear Backend Query Cache")
async def clear_cache():
    """Flushes all cached query results and resets cache statistics."""
    cache_service.clear()
    return {"message": "Cache successfully cleared", "status": "OK"}
