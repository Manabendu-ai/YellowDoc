from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from urllib.parse import quote_plus

DB_PASSWORD = quote_plus(os.getenv("DB_PASSWORD"))
CONNECTION_URL = f"mysql+pymysql://riku:{DB_PASSWORD}@localhost:3306/blogdb"

engine = create_engine(
    CONNECTION_URL
)

SessionLocal = sessionmaker(
    bind = engine,
    autocommit = False,
    autoflush=False
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()