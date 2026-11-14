"""Retrieval authorization, now driven by policies/kb.yaml (same rules as the MCP server).

Differences from the old version: the policy's scopes are applied as a Chroma
metadata PRE-filter (so unauthorized chunks cannot crowd out authorized ones),
and the same scopes are re-checked on every returned chunk as defense in depth.
"""
from pathlib import Path

from mcp_server.policy import PolicyEngine, Subject, kb_scope_filter

_ENGINE = PolicyEngine.from_dir(Path(__file__).resolve().parent / "policies")
_SOC_ROLES = {"soc_analyst", "soc_lead", "auditor"}
_EMPLOYEE_DEPARTMENTS = {"hr", "engineering", "finance"}


def _in_scope(metadata, scopes) -> bool:
    metadata = metadata or {}
    dept = str(metadata.get("department", "")).strip().lower()
    cls = str(metadata.get("classification", "")).strip().lower()
    return any(dept == dict(s)["department"] and cls == dict(s)["classification"] for s in scopes)


def retrieve_authorized_documents(vector_store, question, user):
    """Retrieve documents allowed for the authenticated user's role."""
    department = str(user.get("department", "")).strip().lower()
    role = str(user.get("role", "")).strip().lower()
    if not role:  # legacy callers that only pass a department
        role = ("employee" if department in _EMPLOYEE_DEPARTMENTS
                else "soc_analyst" if department == "soc" else "")
    if not role or not department:
        return []

    collection = "soc" if role in _SOC_ROLES else "handbook"
    decision = _ENGINE.decide(Subject(str(user.get("username", "")), role, department),
                              "kb.search", {"collection": collection})
    if not decision.allow:
        return []

    # Chroma returns a distance (lower = closer). Calibrate this threshold on
    # your actual embedding model and collection; 1.0 is a starting point, not
    # a universal relevance score. Configure RAG_MAX_DISTANCE in .env.
    import os
    max_distance = float(os.getenv("RAG_MAX_DISTANCE", "1.0"))
    scope_filter = kb_scope_filter(decision)
    try:
        scored = vector_store.similarity_search_with_score(
            question, k=10, filter=scope_filter
        )
    except TypeError:
        # Fail closed if the vector store cannot enforce the pre-filter.
        # Do not fall back to an unrestricted vector search.
        return []
    return [doc for doc, distance in scored
            if distance <= max_distance and
            _in_scope(doc.metadata, decision.kb_scopes)][:3]
