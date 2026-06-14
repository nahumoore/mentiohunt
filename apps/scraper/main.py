from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import check_mention_router, health_router, scrape_router

app = FastAPI(title="Scraper Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

app.include_router(scrape_router)
app.include_router(check_mention_router)
app.include_router(health_router)
