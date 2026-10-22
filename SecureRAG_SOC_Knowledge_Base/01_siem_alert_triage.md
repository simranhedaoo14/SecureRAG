# SIEM Alert Triage Playbook

## Purpose
A repeatable, evidence-led process for triaging SIEM alerts. Adapt it to the organization's approved procedures.

## Principles
- Treat an alert as a lead, not proof of compromise.
- Preserve timestamps, raw events, query details, and source identifiers.
- Record timezone and normalize to UTC where possible.
- Do not close an alert just because one indicator is absent.
- Do not open suspicious links or execute files from a production workstation.

## Workflow
1. Validate the alert: ID, detection name/version, first/last seen, asset, user, source/destination, severity, and detection logic.
2. Check data quality: source health, parsing, time sync, duplicates, and expected asset behavior.
3. Establish context: asset criticality, user role, recent changes, maintenance windows, and related alerts.
4. Build a timeline and note log gaps or clock differences.
5. Correlate endpoint, identity, DNS, proxy, firewall, email, cloud audit, and application logs where available.
6. Assess confidence and impact: privileges, persistence, lateral movement, data access, and business impact.
7. Choose a disposition: expected/benign, false positive, suspicious/inconclusive, or incident according to local criteria.
8. Escalate or close with evidence, rationale, gaps, and next action.

## Illustrative severity factors
- Critical: credible active compromise of a high-impact system, privileged identity, widespread impact, or destructive activity.
- High: strong compromise evidence, meaningful privilege, lateral movement, or sensitive-data exposure.
- Medium: suspicious activity with limited corroboration or unknown impact.
- Low: weak signal or isolated anomaly with a plausible benign explanation.
Use the organization's approved severity matrix; these examples are not universal thresholds.

## Evidence checklist
Alert/rule IDs; query and time range; raw event references; log source; hostname/asset; account; IPs/domains/hashes; first/last timestamps; related alerts; benign explanations; analyst actions and approvals.

## Common pitfalls
Do not treat geolocation or reputation scores as conclusive. Consider legitimate admin scripts, scanners, scheduled jobs, and VPN/NAT. “No evidence found” is not proof of no compromise. Preserve raw events before retention expires.

## Escalation template
**Summary:**  
**Affected assets/accounts:**  
**Observed facts:**  
**Assessment and confidence:**  
**Potential impact:**  
**Actions taken:**  
**Evidence and time range:**  
**Unknowns / next steps:**  
**Reason for escalation:**
