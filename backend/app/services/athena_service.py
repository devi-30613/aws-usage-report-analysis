import time
import logging
from typing import Dict, Any, List, Optional
import boto3
from botocore.exceptions import ClientError, BotoCoreError
from app.config import settings
from app.services.cache_service import cache_service

logger = logging.getLogger("athena_service")

class AthenaService:
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
            
            self._client = boto3.client("athena", **session_kwargs)
        return self._client

    def execute_query(self, query: str, database: Optional[str] = None, workgroup: Optional[str] = None) -> str:
        """Submits an SQL query to Amazon Athena and returns the QueryExecutionId."""
        client = self.get_client()
        db = database or settings.athena_database
        wg = workgroup or settings.athena_workgroup

        try:
            response = client.start_query_execution(
                QueryString=query,
                QueryExecutionContext={"Database": db},
                ResultConfiguration={"OutputLocation": settings.athena_output_location},
                WorkGroup=wg
            )
            query_id = response["QueryExecutionId"]
            logger.info(f"Athena query submitted successfully. QueryExecutionId: {query_id}")
            return query_id
        except (ClientError, BotoCoreError) as e:
            logger.error(f"Failed to submit Athena query: {str(e)}")
            raise RuntimeError(f"Athena Query Submission Failed: {str(e)}")

    def wait_for_query(self, query_execution_id: str, max_wait_seconds: int = 60, poll_interval: float = 0.5) -> Dict[str, Any]:
        """Polls Athena until query status transitions to SUCCEEDED, FAILED, or CANCELLED."""
        client = self.get_client()
        start_time = time.time()

        while (time.time() - start_time) < max_wait_seconds:
            try:
                response = client.get_query_execution(QueryExecutionId=query_execution_id)
                status_info = response["QueryExecution"]["Status"]
                state = status_info["State"]

                if state == "SUCCEEDED":
                    execution_time = status_info.get("EngineExecutionTimeInMillis", 0)
                    data_scanned = status_info.get("DataScannedInBytes", 0)
                    logger.info(f"Query {query_execution_id} SUCCEEDED in {execution_time}ms, scanned {data_scanned} bytes")
                    return {
                        "status": "SUCCEEDED",
                        "execution_time_ms": execution_time,
                        "data_scanned_bytes": data_scanned
                    }
                elif state in ["FAILED", "CANCELLED"]:
                    reason = status_info.get("StateChangeReason", "Unknown error")
                    logger.error(f"Query {query_execution_id} {state}: {reason}")
                    raise RuntimeError(f"Athena Query {state}: {reason}")

                time.sleep(poll_interval)
            except (ClientError, BotoCoreError) as e:
                logger.error(f"Error checking query execution status: {str(e)}")
                raise RuntimeError(f"Error checking Athena status: {str(e)}")

        raise TimeoutError(f"Athena Query {query_execution_id} timed out after {max_wait_seconds} seconds.")

    def get_query_results(self, query_execution_id: str, max_results: int = 1000) -> List[Dict[str, Any]]:
        """Retrieves and transforms Athena tabular result set into a list of dictionaries."""
        client = self.get_client()
        rows_result: List[Dict[str, Any]] = []

        try:
            paginator = client.get_paginator("get_query_results")
            response_iterator = paginator.paginate(
                QueryExecutionId=query_execution_id,
                PaginationConfig={"MaxItems": max_results, "PageSize": 100}
            )

            headers: List[str] = []
            types: List[str] = []

            for page_idx, page in enumerate(response_iterator):
                result_set = page.get("ResultSet", {})
                column_info = result_set.get("ResultSetMetadata", {}).get("ColumnInfo", [])
                
                if page_idx == 0:
                    headers = [col.get("Name", f"col_{i}") for i, col in enumerate(column_info)]
                    types = [col.get("Type", "string").lower() for col in column_info]

                rows = result_set.get("Rows", [])
                start_row = 1 if page_idx == 0 else 0  # Skip header row in first page

                for row in rows[start_row:]:
                    row_data = {}
                    data_cells = row.get("Data", [])
                    for i, cell in enumerate(data_cells):
                        if i < len(headers):
                            col_name = headers[i]
                            val = cell.get("VarCharValue", None)
                            # Convert types
                            if val is not None:
                                col_type = types[i]
                                if col_type in ["integer", "bigint", "smallint", "tinyint"]:
                                    try:
                                        val = int(val)
                                    except ValueError:
                                        pass
                                elif col_type in ["double", "float", "decimal", "real"]:
                                    try:
                                        val = round(float(val), 4)
                                    except ValueError:
                                        pass
                            row_data[col_name] = val
                    rows_result.append(row_data)

            return rows_result
        except (ClientError, BotoCoreError) as e:
            logger.error(f"Error fetching Athena results: {str(e)}")
            raise RuntimeError(f"Error retrieving Athena query results: {str(e)}")

    def run_query_and_get_results(self, query: str, use_cache: bool = True, ttl: Optional[int] = None) -> List[Dict[str, Any]]:
        """Helper that runs query end-to-end with caching."""
        cache_key = cache_service._generate_key("athena_query", query=query)
        if use_cache:
            cached_data = cache_service.get(cache_key)
            if cached_data is not None:
                return cached_data

        query_id = self.execute_query(query)
        self.wait_for_query(query_id)
        results = self.get_query_results(query_id)

        if use_cache:
            cache_service.set(cache_key, results, ttl=ttl)

        return results

    def check_connection(self) -> Dict[str, Any]:
        """Validates Athena connection, database, and workgroup accessibility."""
        try:
            client = self.get_client()
            # Test getting database or workgroup
            response = client.get_work_group(WorkGroup=settings.athena_workgroup)
            wg_state = response.get("WorkGroup", {}).get("State", "UNKNOWN")
            return {
                "connected": True,
                "workgroup": settings.athena_workgroup,
                "workgroup_state": wg_state,
                "database": settings.athena_database,
                "table": settings.athena_table,
                "region": settings.aws_region
            }
        except Exception as e:
            logger.warning(f"Athena connection check failed: {str(e)}")
            return {
                "connected": False,
                "error": str(e),
                "database": settings.athena_database,
                "table": settings.athena_table,
                "region": settings.aws_region
            }

athena_service = AthenaService()
