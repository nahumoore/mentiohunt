# Liveness probe. No auth required — used by Docker/load balancer to confirm the service is up.
# Also reports live concurrency-pool occupancy (active/waiting/capacity per pool)
# so queue pressure is observable without grepping logs.

from fastapi.routing import APIRouter

from core import pool_stats

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok", "pools": pool_stats()}
