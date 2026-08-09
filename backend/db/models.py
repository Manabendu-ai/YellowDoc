from sqlalchemy import Column, String, Integer
from .database import Base

class User(Base):
    __tablename__ = "users"
    email = Column(String(50), primary_key=True, index=True)
    name = Column(String(50))
    password = Column(String(50))