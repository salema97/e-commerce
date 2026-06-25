# Runbook: API outage

## Symptoms

- Health endpoint unreachable
- Elevated 502/503 from load balancer
- Web store cannot load catalog

## Immediate actions

1. Check container/pod status and recent deploys.
2. Roll back to previous image/tag if deploy-related.
3. Verify `DATABASE_URL`, `REDIS_URL`, and `JWT_SECRET` / auth keys in runtime env.

## Recovery

```bash
docker build -t ecommerce-api:rollback -f apps/api/Dockerfile .
docker run --env-file apps/api/.env -p 3001:3001 ecommerce-api:rollback
```

4. Scale horizontally if CPU/memory saturated.
5. Enable maintenance page on CDN if RTO exceeded.

## Post-incident

- Capture pino logs and Sentry trace IDs.
- Add missing alerts on `/v1/health` latency and error rate.
