from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import router
from .config import get_settings
from .logger import logger

settings = get_settings()

app = FastAPI(title="Smart Plant Analysis Service", version="0.1.0")
app.include_router(router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"]
    ,
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("Analysis service starting", extra={"mock": settings.mock_analysis})


@app.on_event("shutdown")
async def on_shutdown() -> None:
    logger.info("Analysis service shutting down")
