# Database Connection Pooling Sizing Guide

## Formula for Max Pool Connections
```text
max_connections = ((core_count * 2) + effective_spindle_count)
```
For cloud serverless databases (4 vCPUs), optimal pool size is 10 connections.
Excessive connection counts trigger PostgreSQL context-switching overhead and degrade P99 latency.
