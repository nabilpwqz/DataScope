# DataScope Enterprise Deployment Runbook

## 1. Zero-Downtime Deployment Sequence
1. **Pre-flight Checks**: Execute automated CI pipeline (`node scripts/ci-runner.js --quick`). Verify 0 TypeScript errors, 0 Hallmark violations, 100% test pass.
2. **Database Migration**: Apply non-destructive DDL migrations first. New columns must be nullable or carry safe defaults.
3. **Application Build**: Deploy Next.js bundle to Vercel production edge network.
4. **Health Check Probe**: Verify endpoint `/api/health` responds with HTTP 200 within 200ms.
5. **Traffic Migration**: Route 100% production traffic to the new deployment hash.

## 2. Rollback Playbook
- **Trigger Condition**: P99 latency exceeds 500ms or 5xx error rate exceeds 0.5% over a 3-minute window.
- **Rollback Action**: Instantaneous atomic rollback to previous immutable Vercel deployment artifact via dashboard or CLI.
