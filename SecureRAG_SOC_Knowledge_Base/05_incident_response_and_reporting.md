# Incident Response and Analyst Reporting

## Response phases
Use the organization's approved incident plan and roles. A common lifecycle includes preparation, detection/analysis, containment, eradication/recovery, and post-incident improvement.

## Initial response checklist
- Confirm alert ownership and severity criteria.
- Preserve raw logs and evidence before retention expires.
- Build a timeline and record timezone/clock-source notes.
- Identify impacted users, systems, cloud resources, and business services.
- Determine whether activity is ongoing and whether privacy, legal, regulatory, or safety escalation applies.
- Contact the incident lead and system owner through approved channels.
- Record each action, timestamp, operator, approval, and result.

## Containment decisions
Containment can interrupt services or destroy volatile evidence. Potential actions include endpoint isolation, credential revocation, session termination, blocking a confirmed malicious indicator, or restricting a cloud role. These are examples, not blanket instructions. The incident lead and system owner should consider evidence, urgency, business impact, authorization, and rollback.

## Evidence handling
Preserve originals and work from copies where possible. Record source, collector, collection time, timezone, hash when appropriate, and chain-of-custody details required by policy. Restrict access to personal/confidential data. Never paste secrets, access tokens, or passwords into the assistant. Document gaps and transformations.

## Incident report template
### Executive summary
What happened, affected scope, current status, confidence.

### Timeline
| Time (UTC) | Event | Source | Confidence |
|---|---|---|---|

### Scope and impact
Affected accounts/assets/services, data types, business impact, unknowns.

### Evidence
Alert IDs, event references, queries, indicators, hashes, preserved artifacts.

### Analysis
Separate confirmed observations from hypotheses. Include benign explanations and evidence for/against them.

### Actions
Action, time, operator, approval, result, rollback/recovery details.

### Assessment
Severity under local policy, confidence, ongoing risk, rationale.

### Next steps
Owner, priority, approval, target time, dependency.

### Lessons learned
Detection gaps, telemetry improvements, playbook updates, prevention.

## Communication
Be factual and avoid overclaiming attribution. Say “consistent with” or “potentially indicates” when evidence is incomplete. Use approved incident channels and need-to-know access.
