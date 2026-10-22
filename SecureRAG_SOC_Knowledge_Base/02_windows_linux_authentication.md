# Windows and Linux Authentication Investigations

## Windows signals
- 4624: successful logon. Check logon type, account, source workstation/IP, and authentication package.
- 4625: failed logon. Check target account, status/substatus, logon type, source, and whether failures target one or many accounts.
- 4648: logon attempted with explicit credentials; correlate with host and process.
- 4672: special privileges assigned to a logon; compare with expected privileged behavior.
- 4688: process creation when auditing is enabled.
- 4720, 4722, 4724, 4728, 4732: account creation, account enablement, password reset, and group membership changes.
- Sysmon Event 1: process creation; inspect parent/child, command line, user, hashes, and process GUIDs.
Confirm event meaning and field availability against the actual OS and logging configuration.

## Linux signals
Review authentication logs (often /var/log/auth.log or /var/log/secure), journald, SSH, sudo, and identity-provider logs. Look for repeated failures followed by success, unusual successful access, unexpected sudo/root use, new SSH keys, account/group changes, logging gaps, or unexpected service restarts.

## Investigation steps
1. Choose a bounded time window and normalize timestamps.
2. Group failures by account, source IP, host, and interval.
3. Check whether success followed failures and whether source and target match.
4. Compare against VPN egress, jump hosts, scanners, service accounts, and approved admin work.
5. Correlate MFA/IdP, device posture, endpoint, and subsequent activity.
6. Review privilege changes, processes, remote sessions, and sensitive-resource access.
7. If compromise is plausible, escalate and follow approved containment procedures.

## Example detection logic (pseudocode)
Within a tuned time window, count failures by account and source. Flag anomalous counts; raise priority if success follows from the same source. Suppress only documented, reviewed, time-bounded known-good sources. No fixed threshold fits every environment.

## Questions
Which account/asset was targeted? Was MFA required and successful? Did a success follow? Is the source expected or shared? What did the account do next? Were privileges, credentials, or persistence changed?

## Report fields
Raw event references, source/destination, account, time range, authentication result, logon type or SSH method, MFA evidence, correlated activity, benign explanations, confidence, and next step.
