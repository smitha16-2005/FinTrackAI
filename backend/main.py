from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.limiter import limiter

from app.api.auth import router as auth_router
from app.api.expenses import router as expenses_router
from app.api.incomes import router as incomes_router
from app.api.analytics import router as analytics_router
from app.api.budgets import router as budgets_router
from app.api.savings_goals import router as savings_goals_router
from app.api.dashboard import router as dashboard_router
from app.api.imports import router as imports_router
from app.api.insights import router as insights_router
from app.api.assistant import router as assistant_router
from app.api.exports import router as exports_router
from app.api.notification import router as notifications_router


app = FastAPI(
    title=settings.APP_NAME,
    description="Personal finance management and AI insights API.",
    version="1.0.0",
    docs_url=None if settings.APP_ENV.lower() == "production" else "/docs",
    redoc_url=None if settings.APP_ENV.lower() == "production" else "/redoc",
    openapi_url=None if settings.APP_ENV.lower() == "production" else "/openapi.json",
)


# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


# Host validation
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.allowed_hosts_list,
)


# Basic security headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Cache-Control"] = "no-store"

    if settings.APP_ENV.lower() == "production":
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )

    return response


# API routers
app.include_router(auth_router)
app.include_router(expenses_router)
app.include_router(incomes_router)
app.include_router(analytics_router)
app.include_router(budgets_router)
app.include_router(savings_goals_router)
app.include_router(dashboard_router)
app.include_router(imports_router)
app.include_router(insights_router)
app.include_router(assistant_router)
app.include_router(exports_router)
app.include_router(notifications_router)


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Welcome to FinTrack AI API",
        "environment": settings.APP_ENV,
        "status": "running",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}