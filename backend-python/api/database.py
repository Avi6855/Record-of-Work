import os
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from config import settings

connect_args = {}

if "tidbcloud.com" in settings.DATABASE_URL:
    connect_args["ssl"] = {"rejectUnauthorized": True}
    url = settings.DATABASE_URL.split("?")[0] if "?" in settings.DATABASE_URL else settings.DATABASE_URL
else:
    url = settings.DATABASE_URL

engine = create_engine(
    url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=False,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
