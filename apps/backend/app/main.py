from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api.routes import auth, favorites, requirements, statistics, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="KarakaslarGroup API", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(users.router, prefix="/api/users", tags=["users"])
    app.include_router(requirements.router, prefix="/api/requirements", tags=["requirements"])
    app.include_router(favorites.router, prefix="/api/favorites", tags=["favorites"])
    app.include_router(statistics.router, prefix="/api/statistics", tags=["statistics"])

    return app


app = create_app()
