#!/usr/bin/env python3
"""
AWS Usage & Report Analysis Platform - Automated Cloud Setup Script

This script automatically provisions and configures all required AWS resources:
1. Validates AWS IAM Credentials & retrieves Account ID
2. Creates S3 Data Bucket and Athena Results Bucket
3. Uploads sample/cur billing data to S3 (raw-usage-data/)
4. Creates Athena Database ('aws_usage_db')
5. Creates Athena External Table ('aws_usage_reports') pointing to S3
6. Executes a validation query in Athena
7. Updates backend/.env with DATA_SOURCE=aws and active resource names
"""

import os
import sys
import time
import argparse
import boto3
from botocore.exceptions import ClientError

def update_env_file(env_path, updates):
    """Updates key-value pairs in the .env file preserving existing comments."""
    if not os.path.exists(env_path):
        with open(env_path, "w") as f:
            for k, v in updates.items():
                f.write(f"{k}={v}\n")
        return

    with open(env_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    new_lines = []
    updated_keys = set()

    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#") and "=" in stripped:
            key = stripped.split("=", 1)[0].strip()
            if key in updates:
                new_lines.append(f"{key}={updates[key]}\n")
                updated_keys.add(key)
                continue
        new_lines.append(line)

    # Append any keys that were not already in the file
    for k, v in updates.items():
        if k not in updated_keys:
            new_lines.append(f"{k}={v}\n")

    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)

def run_athena_query(athena_client, query_string, database, output_location):
    """Executes a query in Athena and waits for completion."""
    print(f"  -> Executing: {query_string.splitlines()[0][:60]}...")
    response = athena_client.start_query_execution(
        QueryString=query_string,
        QueryExecutionContext={"Database": database} if database else {},
        ResultConfiguration={"OutputLocation": output_location}
    )
    query_execution_id = response["QueryExecutionId"]

    # Poll status
    while True:
        status_resp = athena_client.get_query_execution(QueryExecutionId=query_execution_id)
        state = status_resp["QueryExecution"]["Status"]["State"]
        if state == "SUCCEEDED":
            return query_execution_id
        elif state in ["FAILED", "CANCELLED"]:
            reason = status_resp["QueryExecution"]["Status"].get("StateChangeReason", "Unknown error")
            raise RuntimeError(f"Athena Query {state}: {reason}")
        time.sleep(1)

def main():
    parser = argparse.ArgumentParser(description="Automated AWS S3 & Athena Setup for Usage Analysis Platform")
    parser.add_argument("--region", default="us-east-1", help="AWS Region (default: us-east-1)")
    parser.add_argument("--access-key", default=None, help="AWS Access Key ID")
    parser.add_argument("--secret-key", default=None, help="AWS Secret Access Key")
    parser.add_argument("--session-token", default=None, help="AWS Session Token (optional)")
    parser.add_argument("--data-file", default="data/sample_aws_usage.csv", help="Path to CSV billing data")
    args = parser.parse_args()

    # Load existing .env if available
    backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
    env_file = os.path.join(backend_dir, ".env")

    region = args.region or os.getenv("AWS_REGION", "us-east-1")
    access_key = args.access_key or os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = args.secret_key or os.getenv("AWS_SECRET_ACCESS_KEY")
    session_token = args.session_token or os.getenv("AWS_SESSION_TOKEN")

    print("\n========================================================")
    print("  AWS Usage & Report Analysis - Cloud Provisioning Setup")
    print("========================================================\n")

    # If keys not provided in CLI or env, prompt user
    if not access_key:
        access_key = input("Enter your AWS Access Key ID: ").strip()
    if not secret_key:
        secret_key = input("Enter your AWS Secret Access Key: ").strip()
    if not region:
        region = input("Enter your AWS Region (e.g. us-east-1): ").strip() or "us-east-1"

    session_kwargs = {"region_name": region}
    if access_key and secret_key:
        session_kwargs["aws_access_key_id"] = access_key
        session_kwargs["aws_secret_access_key"] = secret_key
        if session_token:
            session_kwargs["aws_session_token"] = session_token

    print(f"\n[1/6] Connecting to AWS STS in region '{region}'...")
    try:
        session = boto3.Session(**session_kwargs)
        sts = session.client("sts")
        caller_identity = sts.get_caller_identity()
        account_id = caller_identity["Account"]
        arn = caller_identity["Arn"]
        print(f"  [SUCCESS] Authenticated as: {arn}")
        print(f"  [SUCCESS] AWS Account ID: {account_id}")
    except Exception as e:
        print(f"  [ERROR] Failed to authenticate with AWS: {str(e)}")
        sys.exit(1)

    s3 = session.client("s3")
    athena = session.client("athena")

    # S3 Bucket Names
    data_bucket = f"aws-usage-data-{account_id}-{region}"
    athena_results_bucket = f"aws-athena-results-{account_id}-{region}"
    athena_output_location = f"s3://{athena_results_bucket}/athena-results/"

    print(f"\n[2/6] Provisioning Amazon S3 Buckets...")
    for bucket_name in [data_bucket, athena_results_bucket]:
        try:
            s3.head_bucket(Bucket=bucket_name)
            print(f"  [INFO] Bucket '{bucket_name}' already exists and is accessible.")
        except ClientError:
            print(f"  -> Creating bucket '{bucket_name}'...")
            try:
                if region == "us-east-1":
                    s3.create_bucket(Bucket=bucket_name)
                else:
                    s3.create_bucket(
                        Bucket=bucket_name,
                        CreateBucketConfiguration={"LocationConstraint": region}
                    )
                print(f"  [SUCCESS] Created S3 bucket: {bucket_name}")
            except Exception as e:
                print(f"  [ERROR] Could not create bucket '{bucket_name}': {str(e)}")
                sys.exit(1)

    # Upload Data File
    data_file_path = args.data_file
    if not os.path.isabs(data_file_path):
        data_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), data_file_path)

    print(f"\n[3/6] Uploading Billing & Usage Data to S3 Data Lake...")
    if os.path.exists(data_file_path):
        s3_key = "raw-usage-data/sample_aws_usage.csv"
        try:
            s3.upload_file(data_file_path, data_bucket, s3_key)
            print(f"  [SUCCESS] Uploaded {os.path.basename(data_file_path)} to s3://{data_bucket}/{s3_key}")
        except Exception as e:
            print(f"  [ERROR] S3 upload failed: {str(e)}")
            sys.exit(1)
    else:
        print(f"  [WARNING] Data file {data_file_path} not found. Skipping upload.")

    # Athena Database & Table
    db_name = "aws_usage_db"
    table_name = "aws_usage_reports"

    print(f"\n[4/6] Creating Athena Database '{db_name}'...")
    try:
        create_db_sql = f"CREATE DATABASE IF NOT EXISTS {db_name};"
        run_athena_query(athena, create_db_sql, None, athena_output_location)
        print(f"  [SUCCESS] Athena Database '{db_name}' is ready.")
    except Exception as e:
        print(f"  [ERROR] Failed to create Athena database: {str(e)}")
        sys.exit(1)

    print(f"\n[5/6] Creating Athena External Table '{table_name}'...")
    create_table_sql = f"""
    CREATE EXTERNAL TABLE IF NOT EXISTS {db_name}.{table_name} (
        `date` STRING,
        `service` STRING,
        `region` STRING,
        `usage_type` STRING,
        `usage_quantity` DOUBLE,
        `usage_unit` STRING,
        `cost` DOUBLE,
        `currency` STRING,
        `resource_id` STRING,
        `account_id` STRING,
        `tag_environment` STRING,
        `tag_project` STRING
    )
    ROW FORMAT DELIMITED
    FIELDS TERMINATED BY ','
    ESCAPED BY '\\\\'
    LINES TERMINATED BY '\\n'
    LOCATION 's3://{data_bucket}/raw-usage-data/'
    TBLPROPERTIES (
        'skip.header.line.count'='1',
        'has_encrypted_data'='false'
    );
    """
    try:
        run_athena_query(athena, create_table_sql, db_name, athena_output_location)
        print(f"  [SUCCESS] External table '{db_name}.{table_name}' is ready.")
    except Exception as e:
        print(f"  [ERROR] Failed to create Athena table: {str(e)}")
        sys.exit(1)

    print(f"\n[6/6] Validating Live Athena Query Execution...")
    test_query = f"SELECT service, COUNT(*) AS cnt, ROUND(SUM(cost), 2) AS total_cost FROM {db_name}.{table_name} GROUP BY service ORDER BY total_cost DESC LIMIT 5;"
    try:
        qid = run_athena_query(athena, test_query, db_name, athena_output_location)
        res = athena.get_query_results(QueryExecutionId=qid)
        rows = res.get("ResultSet", {}).get("Rows", [])
        print(f"  [SUCCESS] Test Query executed successfully! Retrieved {len(rows)-1} rows from live Athena.")
    except Exception as e:
        print(f"  [WARNING] Query validation had an issue: {str(e)}")

    # Update backend/.env file
    print(f"\nSaving configuration to backend/.env...")
    env_updates = {
        "DATA_SOURCE": "aws",
        "AWS_REGION": region,
        "AWS_ACCESS_KEY_ID": access_key,
        "AWS_SECRET_ACCESS_KEY": secret_key,
        "ATHENA_DATABASE": db_name,
        "ATHENA_TABLE": table_name,
        "ATHENA_WORKGROUP": "primary",
        "ATHENA_OUTPUT_LOCATION": athena_output_location,
        "S3_BUCKET": data_bucket,
        "S3_PREFIX": "raw-usage-data/"
    }
    if session_token:
        env_updates["AWS_SESSION_TOKEN"] = session_token

    update_env_file(env_file, env_updates)
    print("  [SUCCESS] backend/.env updated with DATA_SOURCE=aws and S3/Athena parameters.")

    print("\n========================================================")
    print("  AWS CONNECTION COMPLETE! Platform is now LIVE on AWS!")
    print("========================================================")
    print(f"  * Mode: LIVE AWS")
    print(f"  * Account: {account_id}")
    print(f"  * Region: {region}")
    print(f"  * S3 Data Bucket: s3://{data_bucket}/raw-usage-data/")
    print(f"  * Athena Database: {db_name}")
    print(f"  * Athena Table: {table_name}")
    print("\nYou can now refresh your browser at http://localhost:5173 to view live data!\n")

if __name__ == "__main__":
    main()
