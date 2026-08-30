import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import engine, Base
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


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Record of Work API"}


@app.get("/api/hello")
def hello():
    return {"message": "Hello from Record of Work API"}
