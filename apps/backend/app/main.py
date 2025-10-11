from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import CORS_ORIGINS
from app.core.db import Base, engine
from sqlalchemy import text

# import routers
from app.core.api import router as core_router
from app.build.api import router as build_router
from app.manage.api import router as manage_router

# import models so tables are known to metadata
from app.core import models as core_models
from app.build import models as build_models
from app.manage import models as manage_models

app = FastAPI(title="KarakaslarGroup API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ensure schemas exist (dev convenience; in prod use Alembic)
with engine.begin() as conn:
    conn.execute(text('CREATE SCHEMA IF NOT EXISTS "core"'))
    conn.execute(text('CREATE SCHEMA IF NOT EXISTS "build"'))
    conn.execute(text('CREATE SCHEMA IF NOT EXISTS "manage"'))
    Base.metadata.create_all(bind=conn)

# mount routers
app.include_router(core_router)
app.include_router(build_router)
app.include_router(manage_router)

@app.get("/")
def root():
    return {"name": "KarakaslarGroup API", "routes": ["/api/core/health", "/api/build/projects/hello", "/api/manage/sites/hello"]}

