import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import engine, Base, SessionLocal
from routes import (
    auth, workers, projects, attendance, payments, advances,
    expenses, clients, client_payments, ledger, dashboard,
    daily_closing, notifications, users, reports, settings as settings_router,
)

app = FastAPI(title="Record of Work API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(workers.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(attendance.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(advances.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(clients.router, prefix="/api")
app.include_router(client_payments.router, prefix="/api")
app.include_router(ledger.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(daily_closing.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")

_db_initialized = False


def _create_database_if_not_exists():
    """Create the database if it doesn't exist (for TiDB/new MySQL servers)."""
    import pymysql
    from urllib.parse import urlparse, parse_qs
    url = settings.DATABASE_URL
    # Parse the URL to extract components
    # Format: mysql+pymysql://user:pass@host:port/dbname?params
    url_no_driver = url.replace("mysql+pymysql://", "https://")
    parsed = urlparse(url_no_driver)
    host = parsed.hostname
    port = parsed.port or 3306
    user = parsed.username
    password = parsed.password
    db_name = parsed.path.lstrip("/") or "record_of_work"

    try:
        ssl_config = {"rejectUnauthorized": True} if "tidbcloud.com" in (host or "") else None
        conn_kwargs = {"host": host, "port": port, "user": user, "password": password}
        if ssl_config:
            import ssl
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            conn_kwargs["ssl"] = ctx

        conn = pymysql.connect(**conn_kwargs)
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        conn.commit()
        cursor.close()
        conn.close()
        print(f"Database '{db_name}' ensured.")
    except Exception as e:
        print(f"Warning: Could not pre-create database: {e}")


def _init_db():
    global _db_initialized
    if _db_initialized:
        return
    _create_database_if_not_exists()
    Base.metadata.create_all(bind=engine)
    _db_initialized = True


@app.on_event("startup")
def startup():
    _init_db()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Record of Work API"}


@app.get("/api/hello")
def hello():
    return {"message": "Hello from Record of Work API"}


@app.post("/api/init")
def init_db():
    from seed import seed_data
    _init_db()
    seed_data()
    return {"message": "Database initialized and seeded"}
