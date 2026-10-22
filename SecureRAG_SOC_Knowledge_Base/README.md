# SecureRAG SOC Knowledge Base

Starter defensive knowledge base for the SOC Analyst Assistant.

## Documents
1. SIEM alert triage
2. Windows and Linux authentication investigations
3. Phishing and suspicious URL investigation
4. Threat hunting and MITRE ATT&CK mapping
5. Incident response and reporting
6. Cloud IAM and API abuse investigation

## Required metadata
When ingesting each document, use:
- `department: "soc"`
- `classification: "internal"` (or `"confidential"` for restricted content)
- `source`: document filename

The current retrieval policy allows SOC-tagged documents with `internal` or `confidential` classification. Do not place HR, Finance, or Engineering documents in this collection.

These are general playbooks, not organization-approved policy. Review severity thresholds, escalation contacts, containment authority, and tooling before operational use. Do not add credentials, tokens, real customer data, or sensitive incident records.
