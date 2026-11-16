# ADR-0012: Role-Based Authorization Policy Enforcement Architecture

## Status
Accepted

## Context
DataScope supports three user personas: Administrator, Data Analyst, and Business Viewer.
Client-side UI role checks can be tampered with or bypassed via manual API calls.

## Decision
Implement strict server-side authorization enforcement:
1. Every API route verifies caller identity via cryptographic session token.
2. The authorize() middleware queries access_permissions table for dataset-specific access rights (can_read, can_write, can_export, can_manage).
3. The platform user directory enforces role inheritance:
   - Admin: Full system control, dataset deletion, user clearance configuration.
   - Analyst: Read public/restricted datasets, export CSV/JSON, save and share views.
   - Viewer: Read-only access to authorized public datasets; mutations return 403 Forbidden.

## Consequences
- Tamper-proof security boundary verified by automated test suites.
- Consistent audit logging for all privilege escalations and policy violations.
