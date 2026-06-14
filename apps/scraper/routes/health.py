# Liveness probe. No auth required — used by Docker/load balancer to confirm the service is up.

from fastapi.routing import APIRouter

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}
