import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv

import app.models

from app.routers import auth
from app.routers import employees
from app.routers import departments
from app.routers import tasks
from app.routers import employee_portal
from app.routers import work_records
from app.routers import admin_work_records
from app.routers import performance
from app.routers import admin_performance
from app.routers import activity
from app.routers import reports
from app.routers import ml_analytics
from app.routers import websocket


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


# ============================================================
# APPLICATION CONFIGURATION
# ============================================================

APP_ENV = os.getenv(
    "APP_ENV",
    "development"
)


FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
)


FRONTEND_LOCAL_URL = os.getenv(
    "FRONTEND_LOCAL_URL",
    "http://127.0.0.1:5173"
)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Employee Management System API",
    description=(
        "Backend API for employee management, "
        "authentication, task management, daily work records, "
        "employee performance, admin performance comparison, "
        "management reports, ML analytics, activity monitoring, "
        "employee portal, and real-time dashboard."
    ),
    version="1.0.0"
)


# ============================================================
# BUILD ALLOWED CORS ORIGINS
# ============================================================

allowed_origins = []


# ------------------------------------------------------------
# PRIMARY FRONTEND URL
#
# Development example:
# http://localhost:5173
#
# Production example:
# https://your-frontend.onrender.com
# ------------------------------------------------------------

if FRONTEND_URL:

    allowed_origins.append(
        FRONTEND_URL.rstrip("/")
    )


# ------------------------------------------------------------
# OPTIONAL LOCAL FRONTEND URL
# ------------------------------------------------------------

if FRONTEND_LOCAL_URL:

    local_origin = (
        FRONTEND_LOCAL_URL.rstrip("/")
    )

    if (
        local_origin
        not in allowed_origins
    ):

        allowed_origins.append(
            local_origin
        )


# ------------------------------------------------------------
# ADD STANDARD LOCAL DEVELOPMENT ORIGINS
#
# Keeping these allows local React development while the
# production backend configuration is also available.
# ------------------------------------------------------------

development_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]


for origin in development_origins:

    if (
        origin
        not in allowed_origins
    ):

        allowed_origins.append(
            origin
        )


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=
        allowed_origins,

    allow_credentials=True,

    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],

    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin"
    ]
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(
    auth.router
)

app.include_router(
    employees.router
)

app.include_router(
    departments.router
)

app.include_router(
    tasks.router
)

app.include_router(
    employee_portal.router
)

app.include_router(
    work_records.router
)

app.include_router(
    admin_work_records.router
)

app.include_router(
    performance.router
)

app.include_router(
    admin_performance.router
)

app.include_router(
    activity.router
)

app.include_router(
    reports.router
)

app.include_router(
    ml_analytics.router
)

app.include_router(
    websocket.router
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def home():

    return {
        "message":
            "Employee Management API is running",

        "environment":
            APP_ENV
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "status":
            "healthy",

        "environment":
            APP_ENV
    }