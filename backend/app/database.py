from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

if "postgres" in settings.DATABASE_URL:
    connect_args["options"] = "-c search_path=airport4kgp"

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Use 'airport4kgp' schema for postgres, else None (for sqlite)
schema_name = "airport4kgp" if "postgres" in settings.DATABASE_URL else None
metadata_obj = MetaData(schema=schema_name)

class Base(DeclarativeBase):
    metadata = metadata_obj


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
