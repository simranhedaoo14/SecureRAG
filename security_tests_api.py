"""Authenticated, allowlisted local pytest execution for the SecureRAG demo."""
import os
import subprocess
import sys
import tempfile
import threading
import time
import xml.etree.ElementTree as ET
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

ROOT = Path(__file__).resolve().parent
ALLOWED_TESTS = ("tests/test_policy_matrix.py", "tests/test_v2.py")
_RUN_LOCK = threading.Lock()
_TIMEOUT_SECONDS = 120


def build_router(get_current_user):
    router = APIRouter()

    @router.post("/api/security-tests/run")
    def run_security_tests(user: dict = Depends(get_current_user)):
        if user.get("department") != "soc" or user.get("role") not in {"soc_analyst", "soc_lead"}:
            raise HTTPException(status_code=403, detail="Only SOC analysts and leads can run security tests.")
        if not _RUN_LOCK.acquire(blocking=False):
            raise HTTPException(status_code=409, detail="Security tests are already running.")
        try:
            for rel in ALLOWED_TESTS:
                if not (ROOT / rel).is_file():
                    raise HTTPException(status_code=503, detail=f"Required test file not found: {rel}")
            with tempfile.TemporaryDirectory(prefix="securerag-tests-") as temp:
                temp_path = Path(temp)
                xml_path = temp_path / "results.xml"
                env = os.environ.copy()
                env["SECURERAG_DATA_DIR"] = str(temp_path / "data")
                env["SECURERAG_POLICY_DIR"] = str(ROOT / "policies")
                env["SECURERAG_REVOKED_JTI"] = str(temp_path / "revoked_jti.txt")
                env["JWT_SECRET"] = "isolated-test-secret-not-production-123456"
                env["PYTEST_DISABLE_PLUGIN_AUTOLOAD"] = "1"
                env["PYTHONDONTWRITEBYTECODE"] = "1"
                env["PYTHONPATH"] = str(ROOT)
                command = [sys.executable, "-m", "pytest", *ALLOWED_TESTS,
                           "-q", "-p", "no:cacheprovider", f"--junitxml={xml_path}"]
                started = time.monotonic()
                try:
                    result = subprocess.run(command, cwd=ROOT, env=env, capture_output=True,
                                            text=True, timeout=_TIMEOUT_SECONDS, check=False)
                except subprocess.TimeoutExpired:
                    raise HTTPException(status_code=504, detail="Test run timed out after 120 seconds.")
                duration = round(time.monotonic() - started, 2)
                if not xml_path.is_file():
                    raise HTTPException(status_code=500, detail="Pytest did not produce results. Check pytest and project dependencies. " + (result.stderr or result.stdout)[-1200:])
                try:
                    tree = ET.parse(xml_path)
                    cases = []
                    for case in tree.iter("testcase"):
                        failure = case.find("failure")
                        error = case.find("error")
                        skipped = case.find("skipped")
                        problem = failure if failure is not None else error
                        status = "failed" if problem is not None else "skipped" if skipped is not None else "passed"
                        cases.append({"name": case.get("name", "Unknown test"),
                                      "suite": case.get("classname", ""),
                                      "status": status,
                                      "duration": round(float(case.get("time", "0")), 3),
                                      "details": ((problem.get("message", "") + "\n" + (problem.text or ""))[:2500] if problem is not None else (skipped.get("message", "") if skipped is not None else ""))})
                except (ET.ParseError, ValueError) as exc:
                    raise HTTPException(status_code=500, detail="Could not parse pytest results.") from exc
                passed = sum(t["status"] == "passed" for t in cases)
                failed = sum(t["status"] == "failed" for t in cases)
                skipped = sum(t["status"] == "skipped" for t in cases)
                return {"total": len(cases), "passed": passed, "failed": failed,
                        "skipped": skipped, "duration": duration,
                        "complete": result.returncode in (0, 1),
                        "exit_code": result.returncode, "tests": cases,
                        "note": "Local pytest checks only; these do not test live LLM prompt-injection resistance."}
        finally:
            _RUN_LOCK.release()

    return router
