from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from urllib.parse import quote_plus
import os

load_dotenv()

DB_USER = os.getenv("MYSQL_USER")
DB_PASSWORD = quote_plus(os.getenv("MYSQL_PASSWORD"))
DB_HOST = os.getenv("MYSQL_HOST")
DB_PORT = os.getenv("MYSQL_PORT")
DB_NAME = "yellowdoc"

CONNECTION_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(
    CONNECTION_URL,
    connect_args={
        "ssl": {
            "ca": os.getenv("SSL_CA_PATH")
        }
    }
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()