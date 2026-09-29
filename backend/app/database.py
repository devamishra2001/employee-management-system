import os

from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import (
    declarative_base,
    sessionmaker
)

from urllib.parse import quote_plus


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


# ============================================================
# DATABASE URL
#
# Production:
#   Set DATABASE_URL directly on Render.
#
# Local development:
#   Falls back to individual DB_* values from backend/.env.
# ============================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL"
)


if not DATABASE_URL:

    DB_HOST = os.getenv(
        "DB_HOST",
        "127.0.0.1"
    )

    DB_PORT = os.getenv(
        "DB_PORT",
        "3306"
    )

    DB_NAME = os.getenv(
        "DB_NAME",
        "employee_management_system"
    )

    DB_USER = os.getenv(
        "DB_USER",
        "root"
    )

    DB_PASSWORD = os.getenv(
        "DB_PASSWORD",
        ""
    )


    encoded_user = quote_plus(
        DB_USER
    )

    encoded_password = quote_plus(
        DB_PASSWORD
    )


    DATABASE_URL = (
        f"mysql+pymysql://"
        f"{encoded_user}:"
        f"{encoded_password}@"
        f"{DB_HOST}:"
        f"{DB_PORT}/"
        f"{DB_NAME}"
    )


# ============================================================
# SQLALCHEMY ENGINE
#
# pool_pre_ping:
#   Detects stale database connections.
#
# pool_recycle:
#   Useful for hosted MySQL services that close idle
#   connections.
# ============================================================

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=280,
    pool_size=5,
    max_overflow=10
)


# ============================================================
# SESSION FACTORY
# ============================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# ============================================================
# BASE MODEL CLASS
# ============================================================

Base = declarative_base()


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()