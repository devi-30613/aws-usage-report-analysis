from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_all():
    print("Testing /api/health ...")
    r = client.get("/api/health")
    assert r.status_code == 200, f"Health failed: {r.text}"
    print("[PASS] Health:", r.json()["status"])

    print("Testing /api/dashboard ...")
    r = client.get("/api/dashboard")
    assert r.status_code == 200, f"Dashboard failed: {r.text}"
    dash = r.json()
    print(f"[PASS] Dashboard: Total Cost = ${dash['kpis']['total_cost']:,.2f}, Services = {dash['kpis']['total_services_count']}, Insights = {len(dash['insights'])}")

    print("Testing /api/costs ...")
    r = client.get("/api/costs")
    assert r.status_code == 200, f"Costs failed: {r.text}"
    costs = r.json()
    print(f"[PASS] Costs: Total Cost = ${costs['total_cost']:,.2f}, Top Resources = {len(costs['highest_cost_resources'])}")

    print("Testing /api/usage ...")
    r = client.get("/api/usage")
    assert r.status_code == 200, f"Usage failed: {r.text}"
    usage = r.json()
    print(f"[PASS] Usage: Total Records = {usage['total_usage_records']}, Usage Types = {len(usage['usage_type_breakdown'])}")

    print("Testing /api/services ...")
    r = client.get("/api/services")
    assert r.status_code == 200, f"Services failed: {r.text}"
    svcs = r.json()
    print(f"[PASS] Services: Count = {len(svcs)}, Top = {svcs[0]['service']} (${svcs[0]['total_cost']:,.2f})")

    print("Testing /api/regions ...")
    r = client.get("/api/regions")
    assert r.status_code == 200, f"Regions failed: {r.text}"
    regs = r.json()
    print(f"[PASS] Regions: Count = {len(regs)}, Top = {regs[0]['region_name']} (${regs[0]['total_cost']:,.2f})")

    print("Testing /api/reports/generate ...")
    r = client.post("/api/reports/generate", json={"report_title": "Executive Cloud Spend Review"})
    assert r.status_code == 200, f"Report generation failed: {r.text}"
    rpt = r.json()
    print(f"[PASS] Report generated: ID = {rpt['report_id']}")

    print("Testing /api/reports/download/pdf ...")
    r = client.get("/api/reports/download/pdf")
    assert r.status_code == 200, f"PDF failed: {r.text}"
    assert len(r.content) > 1000, "PDF content too small"
    print(f"[PASS] PDF Report generated: {len(r.content)} bytes")

    print("Testing /api/reports/download/csv ...")
    r = client.get("/api/reports/download/csv")
    assert r.status_code == 200, f"CSV failed: {r.text}"
    assert len(r.content) > 100, "CSV content too small"
    print(f"[PASS] CSV Report generated: {len(r.content)} bytes")

    print("Testing /api/aws/status ...")
    r = client.get("/api/aws/status")
    assert r.status_code == 200, f"AWS status failed: {r.text}"
    status = r.json()
    print(f"[PASS] /api/aws/status: S3 = {status['s3_status']}, Athena = {status['athena_query_status']}")

    print("Testing /api/aws/test-connection (validation check) ...")
    r = client.post("/api/aws/test-connection", json={
        "region": "us-east-1",
        "access_key_id": "AKIAIOSFODNN7EXAMPLE",
        "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
    })
    # Expect 400 with STS invalid token message, but definitely not 404
    assert r.status_code == 400, f"Expected 400 for sample key, got {r.status_code}: {r.text}"
    assert "security token" in r.json().get("detail", "").lower() or "invalid" in r.json().get("detail", "").lower()
    print(f"[PASS] /api/aws/test-connection: Handled invalid sample key cleanly: {r.json()['detail']}")

    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY!\n")

if __name__ == "__main__":
    test_all()
