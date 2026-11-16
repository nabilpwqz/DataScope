# Security Incident Response Playbook

## Severity Levels
- **Sev-1 (Critical)**: Active credential compromise, unauthorized database exfiltration, or complete authentication bypass.
- **Sev-2 (High)**: Denial-of-service, elevated error rates under brute force, or RBAC permission leakage.
- **Sev-3 (Medium)**: Transient rate-limit triggers or misconfigured non-sensitive telemetry.

## Containment Steps
1. Revoke affected session tokens immediately by invalidating session secret hash.
2. Cycle Supabase database credentials and pooler certificates.
3. Inspect `audit_logs` table for compromised user IDs and affected record keys.
4. Issue incident post-mortem with root-cause timeline.
