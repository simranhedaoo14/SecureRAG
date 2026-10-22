# Threat Hunting and MITRE ATT&CK Mapping

## Hunt lifecycle
1. State a specific hypothesis and why it matters.
2. Define assets, identities, data sources, time range, and exclusions.
3. Verify coverage, parsing, retention, and clock sync.
4. Search narrowly, then pivot by user, host, process, IP, domain, hash, and time.
5. Validate against baselines, approved software, maintenance, and change records.
6. Document query, time window, event count, representative event IDs, limitations, and conclusion.
7. Improve detections or logging based on results.

## Example hypotheses
- Password spraying: many accounts receive low-volume failures from one or more sources.
- A privileged account is used from an unusual endpoint and followed by administrative activity.
- A script interpreter is launched by an unexpected parent process.
- A host queries newly observed or algorithmically unusual domains.
- An identity creates a credential or changes permissions outside an approved change window.

## Investigation pivots
Identity: username/SID, authentication method, MFA, source IP, device, session ID.
Endpoint: hostname, process/path, parent, command line, signer, hash, user, process GUID.
Network: source/destination IP and port, DNS query, TLS/SNI, proxy URL, bytes transferred.
Cloud: principal, API action, source IP, user agent, resource, region, result, session context.
Email: message ID, sender, reply-to, URL, attachment hash, delivery/click events.

## ATT&CK mapping
Map only when observed behavior supports a technique. Record technique ID/name and source version, supporting evidence, and benign alternatives. One event rarely proves an entire attack chain. Consult the current official MITRE ATT&CK knowledge base for canonical IDs and names.

## Example hunt record
**Hypothesis:** A script interpreter may have been launched by an unexpected office application.  
**Data:** Endpoint process-creation telemetry.  
**Search:** Find script interpreters whose parent is an office application; retain process GUID, parent, command line, user, hash, and timestamp.  
**Validation:** Check signed software, add-ins, user activity, file origin, and endpoint alerts.  
**Outcome:** Benign / suspicious / inconclusive, with evidence and gaps.  
**Follow-up:** Escalate if corroborated; otherwise tune the detection or improve telemetry.

Hunting should be read-only by default. Endpoint changes require appropriate approval.
