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
# ENVIRONMENT
# ============================================================

load_dotenv()


APP_ENV = os.getenv(
    "APP_ENV",
    "development"
)


FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    ""
).strip().rstrip("/")


FRONTEND_LOCAL_URL = os.getenv(
    "FRONTEND_LOCAL_URL",
    ""
).strip().rstrip("/")


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="Employee Management System API",
    description=(
        "Backend API for employee management, authentication, "
        "task management, daily work records, performance, "
        "reports, ML analytics and real-time activity."
    ),
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

allowed_origins = [
    "https://employee-management-system-frontend-xapm.onrender.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]


if (
    FRONTEND_URL
    and FRONTEND_URL not in allowed_origins
):
    allowed_origins.append(
        FRONTEND_URL
    )


if (
    FRONTEND_LOCAL_URL
    and FRONTEND_LOCAL_URL not in allowed_origins
):
    allowed_origins.append(
        FRONTEND_LOCAL_URL
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
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
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {
        "status":
            "healthy",

        "environment":
            APP_ENV
    }