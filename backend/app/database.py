import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

DATABASE_URL = settings.DATABASE_URL

# Robust Database engine initialization
try:
    if DATABASE_URL and DATABASE_URL.startswith("postgresql"):
        # Create connection pool
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        # Quick verify connection
        connection = engine.connect()
        connection.close()
        print("Saan Database: Connected to PostgreSQL successfully.")
    else:
        raise ValueError("No PostgreSQL URL configured, utilizing local SQLite fallback.")
except Exception as err:
    print(f"Saan Database Warning: PostgreSQL connection failed ({err}). Falling back to local SQLite database.")
    engine = create_engine("sqlite:///./saan_voice.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
