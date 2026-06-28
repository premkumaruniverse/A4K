from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
import app.models  # Ensure all ORM models are registered before create_all

from app.routers import auth, rides, bookings, payment, admin, cabs

from sqlalchemy import text

# ── Create all tables ──────────────────────────────────────────────────────────
if "postgres" in settings.DATABASE_URL:
    with engine.begin() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS airport4kgp"))

Base.metadata.create_all(bind=engine)
# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="KGP Shuttle Booking API",
    description="Kharagpur ↔ Kolkata shuttle booking system",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
PREFIX = "/api/v1"
app.include_router(auth.router,     prefix=PREFIX)
app.include_router(rides.router,    prefix=PREFIX)
app.include_router(bookings.router, prefix=PREFIX)
app.include_router(payment.router,  prefix=PREFIX)
app.include_router(admin.router,    prefix=PREFIX)
app.include_router(cabs.router,     prefix=PREFIX)


@app.get("/", tags=["Health"])
def root():
    return {"message": "KGP Shuttle Booking API v2.0.0", "docs": "/docs"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
