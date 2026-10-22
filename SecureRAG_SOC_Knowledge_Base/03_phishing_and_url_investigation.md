# Phishing and Suspicious URL Investigation

## Preserve the message
Save the original .eml or use the approved export process. Preserve headers, received time, sender, reply-to, recipient, subject, body, message ID, and attachment metadata. Record whether anyone clicked, entered credentials, scanned a QR code, or opened an attachment. Avoid forwarding in a way that strips headers.

## Header and identity review
Compare From, Reply-To, Return-Path, and display name. Review Authentication-Results for SPF, DKIM, and DMARC where present. A pass does not prove safety; a fail alone does not prove maliciousness. Consider forwarding, legitimate bulk-mail providers, and routing.

## URL and domain triage
1. Extract URLs from plain text and HTML; defang them in reports, e.g. hxxps://example[.]com.
2. Parse the hostname and registrable domain carefully; avoid naive substring matching.
3. Compare the domain with the claimed brand's known domain.
4. Check lookalike patterns: character substitution, omitted/added characters, transposition, hyphenation, extra tokens, misleading subdomains, Unicode/punycode.
5. Use approved tools to review passive DNS, certificates, domain age, reputation, and redirects.
6. Treat reputation as one signal. New domains may be legitimate and old domains may be compromised.
7. Use only an approved isolated sandbox if detonation is necessary.

## Risk factors
Brand impersonation; unexpected login/payment/document-sharing prompt; reply-to mismatch; independent corroborating indicators; confirmed user interaction; known malicious infrastructure or payload evidence.

## Response guidance
Follow approved quarantine, blocking, reporting, and notification processes. If credentials were entered, urgently escalate for identity-team action, session revocation, credential reset, MFA review, and sign-in investigation under policy. If an attachment executed, preserve endpoint evidence and escalate. Avoid broad blocking without checking scope and business impact.

## Analyst summary
**Message ID / reporter:**  
**Sender / reply-to:**  
**Subject / received time:**  
**URLs/domains (defanged):**  
**SPF/DKIM/DMARC:**  
**Typosquatting findings:**  
**Attachments/hashes:**  
**User interaction:**  
**Supporting and contradicting evidence:**  
**Risk/confidence:**  
**Recommended actions and approvals:**
