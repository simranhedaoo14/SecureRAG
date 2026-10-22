# Cloud IAM and API Abuse Investigation

## Key audit fields
Event time/region; principal or identity ID; session/role context; API action; target resource; source IP; user agent; MFA/authentication indicators; success/failure and error; request ID; policy or permission changes.

## Suspicious patterns
- Credential creation outside approved workflow.
- Unexpected privilege grants, trust-policy changes, or role assumption.
- Enumeration of identities, storage, secrets, compute, or security settings.
- Unusual region, source network, user agent, or sign-in pattern.
- Denied API bursts followed by successful access.
- Audit logging changes or attempts to alter/delete logs.
- Data access inconsistent with a principal's baseline.

## Investigation steps
1. Confirm identity and credential type; never copy secret values into tickets or the chatbot.
2. Establish whether source, device, role, region, and timing are expected.
3. Build a sequence of API actions around the event.
4. Review policy, role, key, trust, and MFA changes.
5. Correlate with identity-provider, endpoint, network, and change-management records.
6. Identify resources affected and whether data was read, changed, exported, or deleted.
7. Preserve audit logs and request IDs.
8. Escalate to the cloud/identity owner and follow approved containment.

## Response considerations
Approved actions may include credential rotation/revocation, session termination, permission reduction, and evidence preservation. The incident lead and cloud owner should choose the order to avoid disrupting critical services. Do not change production credentials without authority and an impact plan.

## Detection engineering ideas
Alert on unusual credential creation or privilege changes; correlate denied bursts with later success; alert on audit-log configuration changes; baseline API behavior by principal, role, resource, region, and time; use reviewed and revalidated allowlists.

## Report
Principal, action/resource, source, time range, success/failure, permission changes, data impact, evidence IDs, benign explanation, confidence, containment status, and owner.
