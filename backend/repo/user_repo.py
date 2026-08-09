from ..db.database import get_db
from ..db.models import User
from ..db.hashing import hash_password
from ..dto.user_dto import UserRequest
from fastapi import Depends
from sqlalchemy.orm import Session

